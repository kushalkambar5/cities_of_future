from pathlib import Path
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms

from ..config import settings
from .base import BaseDetector

AccidentResultTuple = Tuple[str, float, Dict[str, float]]  # (status, confidence, class_probabilities)


class AccidentDetector(BaseDetector):
    """Accident detection classifier using EfficientNet-B0."""

    def __init__(self, model_path: Optional[str] = None):
        self.model_path = model_path or settings.ACCIDENT_MODEL_PATH
        self.device = torch.device(
            "cuda" if torch.cuda.is_available() and not settings.FORCE_CPU else "cpu"
        )
        self.model: Optional[nn.Module] = None
        self.classes: List[str] = []
        self.transform: Optional[transforms.Compose] = None

    def load(self) -> None:
        if self.model is None:
            if not Path(self.model_path).is_file():
                raise FileNotFoundError(f"Accident model weights not found at: {self.model_path}")

            checkpoint = torch.load(self.model_path, map_location=self.device)
            self.classes = checkpoint["classes"]
            img_size = checkpoint.get("img_size", 224)

            net = models.efficientnet_b0()
            in_features = net.classifier[1].in_features
            net.classifier = nn.Sequential(
                nn.Dropout(0.3),
                nn.Linear(in_features, len(self.classes)),
            )
            net.load_state_dict(checkpoint["state_dict"])
            net.to(self.device).eval()
            self.model = net

            self.transform = transforms.Compose([
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])

    def is_loaded(self) -> bool:
        return self.model is not None

    def predict_frame(self, frame: np.ndarray) -> AccidentResultTuple:
        """Run accident inference on a single BGR image array."""
        self.load()
        assert self.model is not None and self.transform is not None

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(rgb)
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            probs = torch.softmax(self.model(tensor), dim=1)[0]

        idx = int(probs.argmax().item())
        prob_dict = {str(k): round(float(v), 4) for k, v in zip(self.classes, probs.tolist())}
        return str(self.classes[idx]), float(probs[idx].item()), prob_dict

    def predict_batch(self, frames: List[np.ndarray]) -> List[AccidentResultTuple]:
        """Batch predict accident probabilities across frames."""
        if not frames:
            return []
        self.load()
        assert self.model is not None and self.transform is not None

        tensors = torch.stack([
            self.transform(Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)))
            for f in frames
        ]).to(self.device)

        with torch.no_grad():
            probabilities = torch.softmax(self.model(tensors), dim=1)

        output: List[AccidentResultTuple] = []
        for probs in probabilities:
            idx = int(probs.argmax().item())
            prob_dict = {str(k): round(float(v), 4) for k, v in zip(self.classes, probs.tolist())}
            output.append((str(self.classes[idx]), float(probs[idx].item()), prob_dict))

        return output

    def predict(self, frame: np.ndarray) -> AccidentResultTuple:
        return self.predict_frame(frame)
