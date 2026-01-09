"""
오디오 분석용 딥러닝 모델 정의
- SEDResNet: Sound Event Detection을 위한 ResNet 기반 모델
- ASTModel: Abnormal Sound Detection을 위한 오디오 분류 모델
"""
import torch
import torch.nn as nn
import torchvision.models as models


class SEDResNet(nn.Module):
    """
    Sound Event Detection용 ResNet18 모델
    입력: Mel-spectrogram (1, 80, T)
    출력: 음성/소음 분류 (2 classes)
    """
    def __init__(self, num_classes=2):
        super(SEDResNet, self).__init__()
        
        # ResNet18을 백본으로 사용
        self.resnet = models.resnet18(pretrained=False)
        
        # 오디오 스펙트로그램은 1채널이므로 첫 Conv 레이어 수정
        self.resnet.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        
        # 최종 분류 레이어 수정
        num_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(num_features, num_classes)
        
    def forward(self, x):
        """
        Args:
            x: (batch, 1, mel_bins, time_frames) - Mel-spectrogram
        Returns:
            logits: (batch, num_classes)
        """
        return self.resnet(x)


class ASTModel(nn.Module):
    """
    Abnormal Sound Transformer - 비정상 소리 탐지 모델
    정상/위급상황을 구분하는 2-클래스 분류 모델
    Classes: 0=NORMAL, 1=EMERGENCY (비명+도움요청)
    """
    def __init__(self, num_classes=2, input_channels=1, hidden_dim=256):
        super(ASTModel, self).__init__()
        
        # CNN 특징 추출기
        self.feature_extractor = nn.Sequential(
            # Conv Block 1
            nn.Conv2d(input_channels, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Conv Block 2
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Conv Block 3
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            
            # Conv Block 4
            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.BatchNorm2d(512),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )
        
        # 분류 헤드
        self.classifier = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(512, hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, num_classes)
        )
        
    def forward(self, x):
        """
        Args:
            x: (batch, 1, mel_bins, time_frames) - Mel-spectrogram
        Returns:
            logits: (batch, num_classes)
        """
        features = self.feature_extractor(x)
        features = features.view(features.size(0), -1)
        logits = self.classifier(features)
        return logits


# 모델 로드 헬퍼 함수
def load_sed_model(checkpoint_path, device='cpu'):
    """SED 모델 로드"""
    model = SEDResNet(num_classes=2)
    model.load_state_dict(torch.load(checkpoint_path, map_location=device))
    model.eval()
    return model.to(device)


def load_ast_model(checkpoint_path, device='cpu'):
    """AST 모델 로드"""
    model = ASTModel(num_classes=2)
    model.load_state_dict(torch.load(checkpoint_path, map_location=device))
    model.eval()
    return model.to(device)


if __name__ == "__main__":
    # 모델 테스트
    print("=== 모델 아키텍처 테스트 ===\n")
    
    dummy_input = torch.randn(2, 1, 80, 150)
    
    print("1. SEDResNet 테스트")
    sed = SEDResNet(num_classes=2)
    out_sed = sed(dummy_input)
    print(f"   입력 shape: {dummy_input.shape}")
    print(f"   출력 shape: {out_sed.shape}")
    print(f"   파라미터 수: {sum(p.numel() for p in sed.parameters()):,}\n")
    
    print("2. ASTModel 테스트")
    ast = ASTModel(num_classes=2)
    out_ast = ast(dummy_input)
    print(f"   입력 shape: {dummy_input.shape}")
    print(f"   출력 shape: {out_ast.shape}")
    print(f"   파라미터 수: {sum(p.numel() for p in ast.parameters()):,}\n")
    
    print("모델 아키텍처 정상 작동")
