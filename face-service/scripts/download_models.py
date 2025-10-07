#!/usr/bin/env python3

"""
Download required face detection models
"""

import os
import urllib.request
import sys

MODELS_DIR = "app/models"

MODELS = {
    "deploy.prototxt": "https://raw.githubusercontent.com/opencv/opencv/master/samples/dnn/face_detector/deploy.prototxt",
    "res10_300x300_ssd_iter_140000.caffemodel": "https://raw.githubusercontent.com/opencv/opencv_3rdparty/dnn_samples_face_detector_20170830/res10_300x300_ssd_iter_140000.caffemodel"
}


def download_models():
    """Download face detection models"""
    
    # Create models directory
    os.makedirs(MODELS_DIR, exist_ok=True)
    
    print("📥 Downloading face detection models...")
    
    for filename, url in MODELS.items():
        filepath = os.path.join(MODELS_DIR, filename)
        
        if os.path.exists(filepath):
            print(f"✅ {filename} already exists")
            continue
        
        print(f"⬇️  Downloading {filename}...")
        try:
            urllib.request.urlretrieve(url, filepath)
            print(f"✅ Downloaded {filename}")
        except Exception as e:
            print(f"❌ Error downloading {filename}: {e}")
            sys.exit(1)
    
    print("\n✅ All models downloaded successfully!")


if __name__ == "__main__":
    download_models()