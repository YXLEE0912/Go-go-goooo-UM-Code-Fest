import joblib
import os
import sys

try:
    model_path = "backend/models/best_model.pkl"
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}")
        sys.exit(1)
        
    model = joblib.load(model_path)
    print(f"Model type: {type(model)}")
    
    if hasattr(model, "model") and hasattr(model.model, "exog_names"):
        print(f"Exogenous variables: {model.model.exog_names}")
        
    if hasattr(model, "param_names"):
        print(f"Parameter names: {model.param_names}")
        
except Exception as e:
    print(f"Error inspecting model: {e}")
