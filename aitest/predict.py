import torch
import torch.nn as nn
from sentence_transformers import SentenceTransformer
import argparse

# --- Konfiguracja (musi być identyczna jak w modelu treningowym) ---
HIDDEN_LAYERS = [128, 64]
EMBEDDING_MODEL_NAME = "sdadas/st-polish-paraphrase-from-distilroberta"
# Ścieżka do wytrenowanego modelu
MODEL_PATH = "final_model.pth"


class MLPRegressor(nn.Module):
    def __init__(self, input_dim, hidden_layers):
        super().__init__()
        layers = []
        prev_dim = input_dim
        for hidden_dim in hidden_layers:
            layers.append(nn.Linear(prev_dim, hidden_dim))
            layers.append(nn.ReLU())
            prev_dim = hidden_dim
        layers.append(nn.Linear(prev_dim, 1))
        self.model = nn.Sequential(*layers)

    def forward(self, x):
        return self.model(x).squeeze(-1)


def predict(text: str, device: torch.device):
    # Załaduj model do embeddingów
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME, device='cpu')

    input_dim = embedder.get_sentence_embedding_dimension()

    model = MLPRegressor(input_dim=input_dim, hidden_layers=HIDDEN_LAYERS)
    # Ładujemy wagi 
    model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
    model.to(device)
    model.eval() # Przełącz model w tryb ewaluacji

    print(f"Model załadowany na urządzeniu: {device}")

    # Przygotuj dane wejściowe
    with torch.no_grad():
        embedding = embedder.encode(text, convert_to_tensor=True).to(device)
        embedding = embedding.unsqueeze(0)

        # Wykonaj predykcję
        prediction = model(embedding)
        clipped_prediction = torch.clamp(prediction, 1.0, 10.0)

    return clipped_prediction.item()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Oceń przydatność zakupu na podstawie opisu.")
    parser.add_argument("text", type=str, help="Opis zakupu do oceny, np. 'Zakup nowych krzeseł do biura'")
    args = parser.parse_args()

    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        selected_device = torch.device("mps")
    elif torch.cuda.is_available():
        selected_device = torch.device("cuda")
    else:
        selected_device = torch.device("cpu")

    rating = predict(args.text, selected_device)
    print("-----------------------------------------------------")
    print(f"Opis: \"{args.text}\"")
    print(f"Przewidywana ocena przydatności: {rating:.2f} / 10")
    print("-----------------------------------------------------")