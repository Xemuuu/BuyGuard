# Plik służy do trenowania i zapisania modelu MLP, do predykcji uzywamy pliku predict.py


import pandas as pd
import torch
from torch.utils.data import Dataset, DataLoader, random_split
import torch.nn as nn
from sentence_transformers import SentenceTransformer

# --- Konfiguracja ---
HIDDEN_LAYERS = [128, 64]
LEARNING_RATE = 0.0005
BATCH_SIZE = 8
EPOCHS = 40
MODEL_SAVE_PATH = "final_model.pth"

# --- Logika Skryptu ---

def main():
    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        device = torch.device("mps")
        print("Używam MPS (Apple Silicon GPU)")
    elif torch.cuda.is_available():
        device = torch.device("cuda")
        print("Używam CUDA GPU")
    else:
        device = torch.device("cpu")
        print("Używam CPU")

    # Wczytaj dane z CSV
    df = pd.read_csv("dane.csv")
    texts = df["tekst"].tolist()
    ratings = df["ocena"].tolist()

    # Zamień teksty na embeddingi
    print("Rozpoczynam konwersję tekstów na embeddingi...")
    model_name = "sdadas/st-polish-paraphrase-from-distilroberta"
    embedder = SentenceTransformer(model_name, device=device)
    X = embedder.encode(texts, convert_to_tensor=True, show_progress_bar=True)
    y = torch.tensor(ratings, dtype=torch.float32).to(device)
    print("Konwersja zakończona.")

    class PurchaseDataset(Dataset):
        def __init__(self, X, y):
            self.X = X
            self.y = y
        def __len__(self):
            return len(self.y)
        def __getitem__(self, idx):
            return self.X[idx], self.y[idx]

    dataset = PurchaseDataset(X, y)
    train_size = int(0.8 * len(dataset))
    test_size = len(dataset) - train_size
    train_dataset, test_dataset = random_split(dataset, [train_size, test_size])
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)

    # Model MLP
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

    model = MLPRegressor(input_dim=X.shape[1], hidden_layers=HIDDEN_LAYERS).to(device)
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)

    # Trening
    print("Rozpoczynam trening modelu...")
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            preds = model(batch_X)
            loss = criterion(preds, batch_y)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        avg_loss = total_loss / len(train_loader)
        print(f"Epoch {epoch+1}/{EPOCHS}: Loss = {avg_loss:.4f}")

    # Zapisz wytrenowany model
    torch.save(model.state_dict(), MODEL_SAVE_PATH)
    print(f"Trening zakończony. Model zapisany jako {MODEL_SAVE_PATH}")

if __name__ == "__main__":
    main()
