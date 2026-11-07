import sys
import json
import joblib
import pandas as pd

def main():
    try:
        # Load preprocessor and model
        bundle = joblib.load('churn_model_bundle.pkl')
        preprocessor = bundle['preprocessor']
        model = bundle['model']

        # Read JSON input from argument or stdin
        if len(sys.argv) > 1:
            input_data = json.loads(sys.argv[1])
        else:
            input_data = json.load(sys.stdin)

        # Default dictionary with fallbacks
        defaults = {
            'gender': 'Male',
            'SeniorCitizen': 0,
            'Partner': 'No',
            'Dependents': 'No',
            'tenure': 1,
            'PhoneService': 'Yes',
            'MultipleLines': 'No',
            'InternetService': 'Fiber optic',
            'OnlineSecurity': 'No',
            'OnlineBackup': 'No',
            'DeviceProtection': 'No',
            'TechSupport': 'No',
            'StreamingTV': 'No',
            'StreamingMovies': 'No',
            'Contract': 'Month-to-month',
            'PaperlessBilling': 'Yes',
            'PaymentMethod': 'Electronic check',
            'MonthlyCharges': 75.0,
            'TotalCharges': 75.0
        }

        # Override defaults with provided inputs
        sample = {**defaults, **input_data}
        if 'TotalCharges' not in input_data or input_data['TotalCharges'] is None:
            sample['TotalCharges'] = float(sample['tenure']) * float(sample['MonthlyCharges'])

        df = pd.DataFrame([sample])
        X_prep = preprocessor.transform(df)
        prob = float(model.predict_proba(X_prep)[0, 1])
        is_churn = prob >= 0.50

        # Formulate customized retention strategy
        if is_churn:
            risk_level = "CRITICAL HIGH CHURN RISK"
            rec_actions = [
                f"Offer 15% discount or bundled perks to transition from {sample['Contract']} to a 1-Year or 2-Year contract.",
                "Incentivize migration to automated Autopay (credit card or bank transfer) with a $5 recurring monthly bill credit.",
                "Bundle complimentary VIP Tech Support and Online Security to boost perceived value and resolve connectivity friction."
            ]
        else:
            risk_level = "LOW RETENTION RISK (LOYAL SUBSCRIBER)"
            rec_actions = [
                "Customer profile is stable with high retention probability.",
                "Suitable candidate for value-added cross-selling (e.g. streaming add-ons, device upgrades).",
                "Maintain standard relationship management and anniversary loyalty perks."
            ]

        output = {
            "success": True,
            "probability": round(prob, 4),
            "probability_pct": round(prob * 100, 1),
            "is_churn": is_churn,
            "risk_level": risk_level,
            "recommendations": rec_actions,
            "customer_profile": sample
        }

        print(json.dumps(output))

    except Exception as e:
        error_output = {
            "success": False,
            "error": str(e)
        }
        print(json.dumps(error_output))

if __name__ == '__main__':
    main()
