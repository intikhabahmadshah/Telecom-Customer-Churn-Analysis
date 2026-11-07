import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    roc_curve,
    confusion_matrix,
    classification_report
)

def prepare_data():
    csv_path = 'Telco-Customer-Churn.csv'
    if not os.path.exists(csv_path):
        csv_path = r'C:\Users\intik\Documents\PSEB\Telecom Customer Churn Analysis\Telco-Customer-Churn.csv'

    df_raw = pd.read_csv(csv_path)
    df = df_raw.copy()

    # Step 3: Clean
    df['TotalCharges'] = pd.to_numeric(df['TotalCharges'].astype(str).str.strip(), errors='coerce')
    df['TotalCharges'] = df['TotalCharges'].fillna(0.0)
    customer_ids = df['customerID'].tolist()
    df_clean = df.drop(columns=['customerID'])

    # Metadata & High-Level KPIs
    total_customers = len(df_clean)
    churn_counts = df_clean['Churn'].value_counts()
    churn_yes = int(churn_counts.get('Yes', 0))
    churn_no = int(churn_counts.get('No', 0))
    churn_rate = float((churn_yes / total_customers) * 100)

    mean_monthly = float(df_clean['MonthlyCharges'].mean())
    median_monthly = float(df_clean['MonthlyCharges'].median())
    mean_churn_bill = float(df_clean[df_clean['Churn'] == 'Yes']['MonthlyCharges'].mean())
    mean_stay_bill = float(df_clean[df_clean['Churn'] == 'No']['MonthlyCharges'].mean())

    monthly_rev_at_risk = float(churn_yes * mean_churn_bill)
    annual_rev_at_risk = float(monthly_rev_at_risk * 12)

    metadata = {
        'total_customers': total_customers,
        'churn_yes': churn_yes,
        'churn_no': churn_no,
        'churn_rate': round(churn_rate, 2),
        'mean_monthly': round(mean_monthly, 2),
        'median_monthly': round(median_monthly, 2),
        'mean_churn_bill': round(mean_churn_bill, 2),
        'mean_stay_bill': round(mean_stay_bill, 2),
        'monthly_rev_at_risk': round(monthly_rev_at_risk, 2),
        'annual_rev_at_risk': round(annual_rev_at_risk, 2)
    }

    # Contract Breakdown
    contract_stats = []
    for c_val, sub in df_clean.groupby('Contract'):
        c_tot = len(sub)
        c_churn = int((sub['Churn'] == 'Yes').sum())
        c_rate = (c_churn / c_tot) * 100
        contract_stats.append({
            'contract': c_val,
            'subscribers': c_tot,
            'churned': c_churn,
            'churn_rate_pct': round(c_rate, 2),
            'avg_monthly_bill': round(float(sub['MonthlyCharges'].mean()), 2),
            'at_risk_monthly': round(float(c_churn * sub[sub['Churn'] == 'Yes']['MonthlyCharges'].mean() if c_churn > 0 else 0), 2)
        })

    # Tenure Bracket Breakdown
    bins = [0, 12, 24, 48, 72]
    labels = ['0-12 Months (High Risk)', '13-24 Months (Growth)', '25-48 Months (Mature)', '49-72 Months (Loyal)']
    df_clean['tenure_bracket'] = pd.cut(df_clean['tenure'], bins=bins, labels=labels, include_lowest=True)

    tenure_stats = []
    for t_val, sub in df_clean.groupby('tenure_bracket', observed=False):
        t_tot = len(sub)
        t_churn = int((sub['Churn'] == 'Yes').sum())
        t_rate = (t_churn / t_tot) * 100 if t_tot > 0 else 0
        tenure_stats.append({
            'bracket': str(t_val),
            'subscribers': t_tot,
            'churned': t_churn,
            'churn_rate_pct': round(t_rate, 2),
            'median_tenure': int(sub['tenure'].median()) if t_tot > 0 else 0
        })

    # Monthly Charges Bracket Breakdown
    charge_bins = [0, 35, 70, 100, 150]
    charge_labels = ['Budget (<$35)', 'Mid-Tier ($35-$70)', 'High-Tier ($70-$100)', 'Premium (>$100)']
    df_clean['charge_bracket'] = pd.cut(df_clean['MonthlyCharges'], bins=charge_bins, labels=charge_labels, include_lowest=True)

    charge_stats = []
    for cb_val, sub in df_clean.groupby('charge_bracket', observed=False):
        cb_tot = len(sub)
        cb_churn = int((sub['Churn'] == 'Yes').sum())
        cb_rate = (cb_churn / cb_tot) * 100 if cb_tot > 0 else 0
        charge_stats.append({
            'bracket': str(cb_val),
            'subscribers': cb_tot,
            'churned': cb_churn,
            'churn_rate_pct': round(cb_rate, 2),
            'avg_charges': round(float(sub['MonthlyCharges'].mean()), 2) if cb_tot > 0 else 0
        })

    # Payment Method Breakdown
    pm_stats = []
    for pm_val, sub in df_clean.groupby('PaymentMethod'):
        pm_tot = len(sub)
        pm_churn = int((sub['Churn'] == 'Yes').sum())
        pm_rate = (pm_churn / pm_tot) * 100
        pm_stats.append({
            'method': pm_val,
            'subscribers': pm_tot,
            'churned': pm_churn,
            'churn_rate_pct': round(pm_rate, 2),
            'avg_bill': round(float(sub['MonthlyCharges'].mean()), 2)
        })

    # Internet Service Breakdown
    internet_stats = []
    for is_val, sub in df_clean.groupby('InternetService'):
        is_tot = len(sub)
        is_churn = int((sub['Churn'] == 'Yes').sum())
        is_rate = (is_churn / is_tot) * 100
        internet_stats.append({
            'service': is_val,
            'subscribers': is_tot,
            'churned': is_churn,
            'churn_rate_pct': round(is_rate, 2),
            'avg_bill': round(float(sub['MonthlyCharges'].mean()), 2)
        })

    # Machine Learning Preprocessing & Splitting (Step 5 & 6)
    X = df_clean.drop(columns=['Churn', 'tenure_bracket', 'charge_bracket'])
    y = df_clean['Churn'].map({'No': 0, 'Yes': 1})

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    numeric_features = ['tenure', 'MonthlyCharges', 'TotalCharges']
    categorical_features = [c for c in X.columns if c not in numeric_features]

    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), categorical_features)
        ]
    )

    X_train_prep = preprocessor.fit_transform(X_train)
    X_test_prep = preprocessor.transform(X_test)

    cat_encoder = preprocessor.named_transformers_['cat']
    cat_names = cat_encoder.get_feature_names_out(categorical_features)
    all_feature_names = numeric_features + list(cat_names)

    # Step 7: Train Baseline Models
    baseline_models = {
        'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
        'Decision Tree': DecisionTreeClassifier(random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42)
    }

    baseline_metrics = []
    for name, model in baseline_models.items():
        model.fit(X_train_prep, y_train)
        preds = model.predict(X_test_prep)
        proba = model.predict_proba(X_test_prep)[:, 1]
        baseline_metrics.append({
            'model': name,
            'accuracy': round(float(accuracy_score(y_test, preds)), 4),
            'precision': round(float(precision_score(y_test, preds)), 4),
            'recall': round(float(recall_score(y_test, preds)), 4),
            'f1_score': round(float(f1_score(y_test, preds)), 4),
            'roc_auc': round(float(roc_auc_score(y_test, proba)), 4)
        })

    # Step 8: Train Balanced Models
    balanced_models = {
        'Logistic Regression (Balanced)': LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        'Decision Tree (Balanced)': DecisionTreeClassifier(class_weight='balanced', random_state=42),
        'Random Forest (Balanced)': RandomForestClassifier(n_estimators=100, class_weight='balanced', random_state=42)
    }

    balanced_metrics = []
    for name, model in balanced_models.items():
        model.fit(X_train_prep, y_train)
        preds = model.predict(X_test_prep)
        proba = model.predict_proba(X_test_prep)[:, 1]
        balanced_metrics.append({
            'model': name,
            'accuracy': round(float(accuracy_score(y_test, preds)), 4),
            'precision': round(float(precision_score(y_test, preds)), 4),
            'recall': round(float(recall_score(y_test, preds)), 4),
            'f1_score': round(float(f1_score(y_test, preds)), 4),
            'roc_auc': round(float(roc_auc_score(y_test, proba)), 4)
        })

    # Step 9 & 10: Best Tuned Model (Tuned Random Forest)
    best_rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=5,
        min_samples_split=2,
        min_samples_leaf=2,
        class_weight='balanced',
        random_state=42
    )
    best_rf.fit(X_train_prep, y_train)
    y_pred_best = best_rf.predict(X_test_prep)
    y_proba_best = best_rf.predict_proba(X_test_prep)[:, 1]

    cm = confusion_matrix(y_test, y_pred_best)
    cm_list = cm.tolist()

    fpr, tpr, _ = roc_curve(y_test, y_proba_best)
    roc_data = {
        'fpr': [round(float(v), 4) for v in fpr[::max(1, len(fpr)//50)]],
        'tpr': [round(float(v), 4) for v in tpr[::max(1, len(tpr)//50)]],
        'auc': round(float(roc_auc_score(y_test, y_proba_best)), 4)
    }

    tuned_metrics = {
        'model': 'Tuned Random Forest (Best Model)',
        'accuracy': round(float(accuracy_score(y_test, y_pred_best)), 4),
        'precision': round(float(precision_score(y_test, y_pred_best)), 4),
        'recall': round(float(recall_score(y_test, y_pred_best)), 4),
        'f1_score': round(float(f1_score(y_test, y_pred_best)), 4),
        'roc_auc': round(float(roc_auc_score(y_test, y_proba_best)), 4)
    }

    # Top Feature Importances
    importances = best_rf.feature_importances_
    feat_imp = []
    for f_name, imp in zip(all_feature_names, importances):
        feat_imp.append({
            'feature': f_name,
            'importance': round(float(imp), 4)
        })
    feat_imp = sorted(feat_imp, key=lambda x: x['importance'], reverse=True)

    # Save trained model and preprocessor bundle for interactive live prediction
    model_bundle = {
        'preprocessor': preprocessor,
        'model': best_rf,
        'feature_names': all_feature_names,
        'categorical_columns': categorical_features,
        'numeric_columns': numeric_features,
        'raw_columns': X.columns.tolist()
    }
    joblib.dump(model_bundle, 'churn_model_bundle.pkl')

    # Comprehensive Dashboard Payload
    payload = {
        'metadata': metadata,
        'contract_stats': contract_stats,
        'tenure_stats': tenure_stats,
        'charge_stats': charge_stats,
        'pm_stats': pm_stats,
        'internet_stats': internet_stats,
        'baseline_metrics': baseline_metrics,
        'balanced_metrics': balanced_metrics,
        'tuned_metrics': tuned_metrics,
        'confusion_matrix': cm_list,
        'roc_data': roc_data,
        'top_features': feat_imp[:15]
    }

    with open('churn_dashboard_data.json', 'w', encoding='utf-8') as f:
        json.dump(payload, f, indent=2)

    print("Dashboard data and model bundle successfully generated!")
    print(f"Total customers: {metadata['total_customers']}")
    print(f"Tuned Model Recall: {tuned_metrics['recall'] * 100:.2f}%")
    print(f"ROC-AUC: {tuned_metrics['roc_auc']:.4f}")

if __name__ == '__main__':
    prepare_data()
