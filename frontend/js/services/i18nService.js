/**
 * i18nService.js
 * Comprehensive Multi-Language Internationalization Engine for FloodAI.
 * Supports:
 *   - English (en)
 *   - Hindi (hi)
 *   - Tamil (ta)
 *   - Bengali (bn)
 *   - Spanish (es)
 *   - French (fr)
 * Seamlessly translates header, navigation, status tags, view headers, metrics,
 * buttons, settings, and command palette across the entire client side.
 */

const I18N_DICTIONARIES = {
  en: {
    // Brand & Header
    "brand_name": "FloodAI",
    "disaster_intel": "AI Disaster Threat Intelligence Platform",
    "workspace_role": "Workspace Role",
    "switch_role": "Switch Role",
    "atmosphere": "Atmosphere",
    "dark_mode": "Dark Mode",
    "light_mode": "Light Mode",
    "sign_in": "Sign In",
    "sign_out": "Sign Out",
    "create_account": "Create Account",

    // Navigation & Roles
    "admin": "Admin",
    "analyst": "Analyst",
    "resident": "Resident",
    "guest": "Civilian / Guest",
    "admin_ops": "Platform Operations",
    "admin_users": "User Administration",
    "admin_config": "System Configuration",
    "admin_alerts": "Alert Operations",
    "admin_audit": "Audit Explorer",
    "analyst_predict": "Prediction Workbench",
    "analyst_shap": "SHAP Attribution",
    "analyst_comparison": "District Risk Matrix",
    "analyst_history": "Evaluation History",
    "analyst_threat": "Tactical Threat Intel",
    "resident_risk": "My Location Risk",
    "resident_weather": "Local Hydro Weather",
    "resident_alerts": "Emergency Advisories",
    "resident_guide": "Preparedness Guide",
    "resident_activity": "Saved Locations",
    "overview": "Overview",
    "radar_overview": "National Radar Overview",
    "gis_map": "Geospatial GIS Map",
    "disaster_catalog": "Disaster Catalog (10k)",
    "climate_trends": "Climate Trends (24-Yr)",
    "emergency_alerts": "Emergency Alerts & Siren",
    "threat_command": "Threat Command",
    "mlops_benchmarks": "MLOps Benchmarks",
    "operator_profile": "Operator Profile",
    "system_settings": "Settings",
    "preferences": "Preferences",

    // Actions & Buttons
    "run_prediction": "Run a Prediction",
    "view_live_map": "View Live Map",
    "enable_web_push": "Enable Web Push",
    "trigger_sos": "Trigger Emergency SOS",
    "refresh": "Refresh",
    "export_csv": "⬇ Export CSV",
    "inspect_card": "Inspect Card",
    "unlock_checkbox": "Unlock Consent Checkbox",
    "permissions_sensors": "Permissions & Sensors",
    "change_district": "Change District / Sector",
    "jump_to_screen": "Jump to screen or action...",

    // Risk & Status
    "low_risk": "LOW RISK",
    "medium_risk": "MEDIUM RISK",
    "high_risk": "HIGH RISK",
    "very_high_risk": "VERY HIGH RISK",
    "critical_risk": "CRITICAL RISK",
    "active_monitoring": "Active Monitoring",
    "status": "Status",
    "accuracy": "Accuracy",
    "precision": "Precision",
    "recall": "Recall",
    "records": "Records",

    // Settings
    "appearance": "Appearance",
    "language_regional": "Language & Regional",
    "location_privacy": "Location & Privacy",
    "notification_channels": "Notification Channels",
    "weather_flood_risk": "Weather & Flood-Risk",
    "security_account": "Security & Account",
    "accessibility": "Accessibility",
    "about_app": "Application Information",
    "color_mode": "Color Mode",
    "accent_theme": "Accent Colour Theme",
    "platform_language": "Platform Language",
    "auto_fetch_phone": "Auto-fetch from SIM / Device",
    "phone_optional": "Phone Number (Optional)"
  },

  hi: {
    // Brand & Header
    "brand_name": "फ्लड-एआई",
    "disaster_intel": "एआई आपदा खतरा खुफिया मंच",
    "workspace_role": "कार्यक्षेत्र भूमिका",
    "switch_role": "भूमिका बदलें",
    "atmosphere": "मौसम वायुमंडल",
    "dark_mode": "डार्क मोड",
    "light_mode": "लाइट मोड",
    "sign_in": "साइन इन करें",
    "sign_out": "साइन आउट",
    "create_account": "खाता बनाएं",

    // Navigation & Roles
    "admin": "प्रशासक",
    "analyst": "विश्लेषक",
    "resident": "निवासी",
    "guest": "नागरिक / अतिथि",
    "admin_ops": "प्लेटफॉर्म संचालन",
    "admin_users": "उपयोगकर्ता प्रशासन",
    "admin_config": "सिस्टम विन्यास",
    "admin_alerts": "चेतावनी संचालन",
    "admin_audit": "ऑडिट अन्वेषक",
    "analyst_predict": "भविष्यवाणी कार्यशाला",
    "analyst_shap": "एसएचएपी विश्लेषण",
    "analyst_comparison": "जिला जोखिम मैट्रिक्स",
    "analyst_history": "मूल्यांकन इतिहास",
    "analyst_threat": "सामरिक खतरा खुफिया",
    "resident_risk": "मेरी स्थिति का जोखिम",
    "resident_weather": "स्थानीय मौसम",
    "resident_alerts": "आपातकालीन सलाह",
    "resident_guide": "तैयारी मार्गदर्शिका",
    "resident_activity": "सहेजे गए स्थान",
    "overview": "अवलोकन",
    "radar_overview": "राष्ट्रीय रडार अवलोकन",
    "gis_map": "भू-स्थानिक जीआईएस मानचित्र",
    "disaster_catalog": "आपदा सूची (10,000 रिकॉर्ड)",
    "climate_trends": "जलवायु रुझान (24 वर्ष)",
    "emergency_alerts": "आपातकालीन चेतावनी और सायरन",
    "threat_command": "खतरा कमान",
    "mlops_benchmarks": "एमएलओप्स बेंचमार्क",
    "operator_profile": "ऑपरेटर प्रोफाइल",
    "system_settings": "सेटिंग्स",
    "preferences": "प्राथमिकताएं",

    // Actions & Buttons
    "run_prediction": "भविष्यवाणी चलाएं",
    "view_live_map": "लाइव मानचित्र देखें",
    "enable_web_push": "वेब पुश सक्षम करें",
    "trigger_sos": "आपातकालीन एसओएस भेजें",
    "refresh": "ताज़ा करें",
    "export_csv": "⬇ सीएसवी डाउनलोड करें",
    "inspect_card": "दस्तावेज़ समीक्षा करें",
    "unlock_checkbox": "सहमति चेकबॉक्स अनलॉक करें",
    "permissions_sensors": "अनुमतियां और सेंसर",
    "change_district": "जिला / क्षेत्र बदलें",
    "jump_to_screen": "स्क्रीन या क्रिया पर जाएं...",

    // Risk & Status
    "low_risk": "कम जोखिम",
    "medium_risk": "मध्यम जोखिम",
    "high_risk": "उच्च जोखिम",
    "very_high_risk": "अति उच्च जोखिम",
    "critical_risk": "गंभीर जोखिम",
    "active_monitoring": "सक्रिय निगरानी",
    "status": "स्थिति",
    "accuracy": "सटीकता",
    "precision": "परिशुद्धता",
    "recall": "रिकॉल",
    "records": "अभिलेख",

    // Settings
    "appearance": "दिखावट व रंग",
    "language_regional": "भाषा और क्षेत्रीय विकल्प",
    "location_privacy": "स्थान और गोपनीयता",
    "notification_channels": "सूचना चैनल",
    "weather_flood_risk": "मौसम और बाढ़ जोखिम",
    "security_account": "सुरक्षा और खाता",
    "accessibility": "सुलभता",
    "about_app": "एप्लिकेशन जानकारी",
    "color_mode": "रंग मोड",
    "accent_theme": "एक्सेंट रंग थीम",
    "platform_language": "मंच की भाषा",
    "auto_fetch_phone": "सिम/डिवाइस से स्वतः भरें",
    "phone_optional": "फ़ोन नंबर (वैकल्पिक)"
  },

  ta: {
    // Brand & Header
    "brand_name": "பிளட்-ஏஐ",
    "disaster_intel": "செயற்கை நுண்ணறிவு பேரிடர் முன்னறிவிப்பு தளம்",
    "workspace_role": "பணியிட பங்கு",
    "switch_role": "பங்கை மாற்றவும்",
    "atmosphere": "வானிலை சூழல்",
    "dark_mode": "இருண்ட பயன்முறை",
    "light_mode": "வெளிச்ச பயன்முறை",
    "sign_in": "உள்நுழைக",
    "sign_out": "வெளியேறு",
    "create_account": "கணக்கு உருவாக்கவும்",

    // Navigation & Roles
    "admin": "நிர்வாகி",
    "analyst": "ஆய்வாளர்",
    "resident": "குடிமகன்",
    "guest": "விருந்தினர்",
    "admin_ops": "தள செயல்பாடுகள்",
    "admin_users": "பயனர் மேலாண்மை",
    "admin_config": "கணினி கட்டமைப்பு",
    "admin_alerts": "எச்சரிக்கை மேலாண்மை",
    "admin_audit": "தணிக்கை பதிவு",
    "analyst_predict": "முன்கணிப்பு கூடம்",
    "analyst_shap": "காரணி பகுப்பாய்வு",
    "analyst_comparison": "மாவட்ட ஆபத்து அணி",
    "analyst_history": "மதிப்பீட்டு வரலாறு",
    "analyst_threat": "பாதுகாப்பு புலனாய்வு",
    "resident_risk": "என் இடத்தின் ஆபத்து",
    "resident_weather": "உள்ளூர் வானிலை",
    "resident_alerts": "அவசர ஆலோசனைகள்",
    "resident_guide": "தயார்நிலை வழிகாட்டி",
    "resident_activity": "சேமிக்கப்பட்ட இடங்கள்",
    "overview": "கண்ணோட்டம்",
    "radar_overview": "தேசிய ரேடார் கண்ணோட்டம்",
    "gis_map": "புவிசார் வரைபடம்",
    "disaster_catalog": "பேரிடர் தரவுத்தளம் (10,000 பதிவுகள்)",
    "climate_trends": "காலநிலை போக்குகள் (24 ஆண்டுகள்)",
    "emergency_alerts": "அவசர எச்சரிக்கைகள் மற்றும் சைரன்",
    "threat_command": "அபாய கட்டளை மையம்",
    "mlops_benchmarks": "ஏஐ மாதிரிகள் தரம்",
    "operator_profile": "செயல்பாட்டாளர் சுயவிவரம்",
    "system_settings": "அமைப்புகள்",
    "preferences": "விருப்பத்தேர்வுகள்",

    // Actions & Buttons
    "run_prediction": "முன்கணிப்பை இயக்கவும்",
    "view_live_map": "நேரடி வரைபடத்தைப் பார்க்கவும்",
    "enable_web_push": "வலை அறிவிப்பை இயக்கு",
    "trigger_sos": "அவசர SOS அனுப்பு",
    "refresh": "புதுப்பிக்கவும்",
    "export_csv": "⬇ CSV பதிவிறக்கவும்",
    "inspect_card": "விதிமுறைகளை ஆராயுங்கள்",
    "unlock_checkbox": "ஒப்புதலைத் திறக்கவும்",
    "permissions_sensors": "அனுமதிகள் மற்றும் சென்சார்கள்",
    "change_district": "மாவட்டம் / பகுதியை மாற்றவும்",
    "jump_to_screen": "திரைக்கு அல்லது செயலுக்குச் செல்லவும்...",

    // Risk & Status
    "low_risk": "குறைந்த ஆபத்து",
    "medium_risk": "நடுத்தர ஆபத்து",
    "high_risk": "அதிக ஆபத்து",
    "very_high_risk": "மிக அதிக ஆபத்து",
    "critical_risk": "ஆபத்தான நிலை",
    "active_monitoring": "நேரடி கண்காணிப்பில்",
    "status": "நிலை",
    "accuracy": "துல்லியம்",
    "precision": "துல்லியத்தன்மை",
    "recall": "நினைவுகூர்தல்",
    "records": "பதிவுகள்",

    // Settings
    "appearance": "தோற்றம் மற்றும் வண்ணம்",
    "language_regional": "மொழி மற்றும் பிராந்திய விருப்பங்கள்",
    "location_privacy": "இருப்பிடம் மற்றும் தனியுரிமை",
    "notification_channels": "அறிவிப்பு வழிகள்",
    "weather_flood_risk": "வானிலை & வெள்ள ஆபத்து",
    "security_account": "பாதுகாப்பு & கணக்கு",
    "accessibility": "அணுகல் வசதி",
    "about_app": "பயன்பாட்டு தகவல்",
    "color_mode": "வண்ணப் பயன்முறை",
    "accent_theme": "முதன்மை வண்ண தீம்",
    "platform_language": "தளத்தின் மொழி",
    "auto_fetch_phone": "சிம்/கருவியிலிருந்து தானாக நிரப்பவும்",
    "phone_optional": "தொலைபேசி எண் (விருப்பத்தேர்வு)"
  },

  bn: {
    // Brand & Header
    "brand_name": "ফ্লাড-এআই",
    "disaster_intel": "এআই দুর্যোগ পূর্বাভাস প্ল্যাটফর্ম",
    "workspace_role": "ওয়ার্কস্পেস ভূমিকা",
    "switch_role": "ভূমিকা পরিবর্তন করুন",
    "atmosphere": "আবহাওয়া পরিমণ্ডল",
    "dark_mode": "ডার্ক মোড",
    "light_mode": "লাইট মোড",
    "sign_in": "সাইন ইন করুন",
    "sign_out": "সাইন আউট",
    "create_account": "অ্যাকাউন্ট তৈরি করুন",

    // Navigation & Roles
    "admin": "অ্যাডমিন",
    "analyst": "বিশ্লেষক",
    "resident": "নাগরিক",
    "guest": "অতিথি",
    "admin_ops": "প্ল্যাটফর্ম অপারেশন",
    "admin_users": "ব্যবহারকারী ব্যবস্থাপনা",
    "admin_config": "সিস্টেম কনফিগারেশন",
    "admin_alerts": "সতর্কতা অপারেশন",
    "admin_audit": "অডিট এক্সপ্লোরার",
    "analyst_predict": "পূর্বাভাস ওয়ার্কবেঞ্চ",
    "analyst_shap": "এসএইচএপি বিশ্লেষণ",
    "analyst_comparison": "জেলা ঝুঁকি ম্যাট্রিক্স",
    "analyst_history": "মূল্যায়ন ইতিহাস",
    "analyst_threat": "কৌশলগত হুমকি গোয়েন্দা",
    "resident_risk": "আমার অবস্থানের ঝুঁকি",
    "resident_weather": "স্থানীয় আবহাওয়া",
    "resident_alerts": "জরুরী পরামর্শ",
    "resident_guide": "প্রস্তুতি নির্দেশিকা",
    "resident_activity": "সংরক্ষিত স্থান",
    "overview": "সারসংক্ষেপ",
    "radar_overview": "জাতীয় রাডার সারসংক্ষেপ",
    "gis_map": "ভৌগলিক জিআইএস মানচিত্র",
    "disaster_catalog": "দুর্যোগ ক্যাটালগ (১০,০০০ রেকর্ড)",
    "climate_trends": "জলবায়ু প্রবণতা (২৪ বছর)",
    "emergency_alerts": "জরুরী সতর্কতা এবং সাইরেন",
    "threat_command": "হুমকি কমান্ড",
    "mlops_benchmarks": "এমএলওপ্স বেঞ্চমার্ক",
    "operator_profile": "অপারেটর প্রোফাইল",
    "system_settings": "সেটিংস",
    "preferences": "পছন্দসমূহ",

    // Actions & Buttons
    "run_prediction": "পূর্বাভাস চালান",
    "view_live_map": "লাইভ মানচিত্র দেখুন",
    "enable_web_push": "ওয়েব পুশ চালু করুন",
    "trigger_sos": "জরুরী এসওএস পাঠান",
    "refresh": "রিফ্রেশ করুন",
    "export_csv": "⬇ সিএসভি ডাউনলোড করুন",
    "inspect_card": "নীতিমালা পর্যালোচনা করুন",
    "unlock_checkbox": "সম্মতি চেকবক্স আনলক করুন",
    "permissions_sensors": "অনুমতি এবং সেন্সর",
    "change_district": "জেলা / অঞ্চল পরিবর্তন করুন",
    "jump_to_screen": "স্ক্রিন বা অ্যাকশনে যান...",

    // Risk & Status
    "low_risk": "কম ঝুঁকি",
    "medium_risk": "মাঝারি ঝুঁকি",
    "high_risk": "উচ্চ ঝুঁকি",
    "very_high_risk": "অতি উচ্চ ঝুঁকি",
    "critical_risk": "সংকটপূর্ণ ঝুঁকি",
    "active_monitoring": "সক্রিয় পর্যবেক্ষণ",
    "status": "স্থিতি",
    "accuracy": "নির্ভুলতা",
    "precision": "যথার্থতা",
    "recall": "রিকল",
    "records": "রেকর্ড",

    // Settings
    "appearance": "চেহারা এবং থিম",
    "language_regional": "ভাষা এবং আঞ্চলিক সেটিংস",
    "location_privacy": "অবস্থান এবং গোপনীয়তা",
    "notification_channels": "বিজ্ঞপ্তি চ্যানেল",
    "weather_flood_risk": "আবহাওয়া এবং বন্যা ঝুঁকি",
    "security_account": "নিরাপত্তা ও অ্যাকাউন্ট",
    "accessibility": "অ্যাক্সেসযোগ্যতা",
    "about_app": "অ্যাপ্লিকেশন তথ্য",
    "color_mode": "কালার মোড",
    "accent_theme": "অ্যাকসেন্ট কালার থিম",
    "platform_language": "প্ল্যাটফর্মের ভাষা",
    "auto_fetch_phone": "সিম/ডিভাইস থেকে স্বয়ংক্রিয়ভাবে আনুন",
    "phone_optional": "ফোন নম্বর (ঐচ্ছিক)"
  },

  es: {
    // Brand & Header
    "brand_name": "FloodAI",
    "disaster_intel": "Plataforma de Inteligencia ante Desastres por IA",
    "workspace_role": "Rol de Espacio",
    "switch_role": "Cambiar Rol",
    "atmosphere": "Atmósfera",
    "dark_mode": "Modo Oscuro",
    "light_mode": "Modo Claro",
    "sign_in": "Iniciar Sesión",
    "sign_out": "Cerrar Sesión",
    "create_account": "Crear Cuenta",

    // Navigation & Roles
    "admin": "Administrador",
    "analyst": "Analista",
    "resident": "Residente",
    "guest": "Civil / Invitado",
    "admin_ops": "Operaciones de Plataforma",
    "admin_users": "Administración de Usuarios",
    "admin_config": "Configuración del Sistema",
    "admin_alerts": "Gestión de Alertas",
    "admin_audit": "Registro de Auditoría",
    "analyst_predict": "Banco de Predicción",
    "analyst_shap": "Atribución SHAP",
    "analyst_comparison": "Matriz de Riesgo Distrital",
    "analyst_history": "Historial de Evaluación",
    "analyst_threat": "Inteligencia Táctica de Amenazas",
    "resident_risk": "Riesgo en Mi Ubicación",
    "resident_weather": "Clima Hidrológico Local",
    "resident_alerts": "Avisos de Emergencia",
    "resident_guide": "Manual de Preparación",
    "resident_activity": "Ubicaciones Guardadas",
    "overview": "Resumen General",
    "radar_overview": "Radar Nacional General",
    "gis_map": "Mapa SIG Geoespacial",
    "disaster_catalog": "Catálogo de Desastres (10k)",
    "climate_trends": "Tendencias Climáticas (24 Años)",
    "emergency_alerts": "Alertas de Emergencia y Sirena",
    "threat_command": "Comando de Amenazas",
    "mlops_benchmarks": "Métricas MLOps",
    "operator_profile": "Perfil del Operador",
    "system_settings": "Configuración",
    "preferences": "Preferencias",

    // Actions & Buttons
    "run_prediction": "Ejecutar Predicción",
    "view_live_map": "Ver Mapa en Vivo",
    "enable_web_push": "Activar Notificaciones Web",
    "trigger_sos": "Emitir SOS de Emergencia",
    "refresh": "Actualizar",
    "export_csv": "⬇ Exportar CSV",
    "inspect_card": "Inspeccionar Tarjeta",
    "unlock_checkbox": "Desbloquear Consentimiento",
    "permissions_sensors": "Permisos y Sensores",
    "change_district": "Cambiar Distrito / Sector",
    "jump_to_screen": "Ir a pantalla o acción...",

    // Risk & Status
    "low_risk": "RIESGO BAJO",
    "medium_risk": "RIESGO MEDIO",
    "high_risk": "RIESGO ALTO",
    "very_high_risk": "RIESGO MUY ALTO",
    "critical_risk": "RIESGO CRÍTICO",
    "active_monitoring": "Monitoreo Activo",
    "status": "Estado",
    "accuracy": "Precisión Global",
    "precision": "Precisión",
    "recall": "Exhaustividad",
    "records": "Registros",

    // Settings
    "appearance": "Apariencia",
    "language_regional": "Idioma y Región",
    "location_privacy": "Ubicación y Privacidad",
    "notification_channels": "Canales de Notificación",
    "weather_flood_risk": "Clima y Riesgo de Inundación",
    "security_account": "Seguridad y Cuenta",
    "accessibility": "Accesibilidad",
    "about_app": "Información de la Aplicación",
    "color_mode": "Modo de Color",
    "accent_theme": "Tema de Color de Énfasis",
    "platform_language": "Idioma de la Plataforma",
    "auto_fetch_phone": "Obtener de SIM / Dispositivo",
    "phone_optional": "Número Telefónico (Opcional)"
  },

  fr: {
    // Brand & Header
    "brand_name": "FloodAI",
    "disaster_intel": "Plateforme d'Intelligence Prédictive des Catastrophes IA",
    "workspace_role": "Rôle de l'Espace",
    "switch_role": "Changer de Rôle",
    "atmosphere": "Atmosphère",
    "dark_mode": "Mode Sombre",
    "light_mode": "Mode Clair",
    "sign_in": "Se Connecter",
    "sign_out": "Déconnexion",
    "create_account": "Créer un Compte",

    // Navigation & Roles
    "admin": "Administrateur",
    "analyst": "Analyste",
    "resident": "Résident",
    "guest": "Civil / Invité",
    "admin_ops": "Opérations de la Plateforme",
    "admin_users": "Gestion des Utilisateurs",
    "admin_config": "Configuration Système",
    "admin_alerts": "Opérations d'Alerte",
    "admin_audit": "Explorateur d'Audit",
    "analyst_predict": "Atelier de Prédiction",
    "analyst_shap": "Attribution SHAP",
    "analyst_comparison": "Matrice des Risques de District",
    "analyst_history": "Historique d'Évaluation",
    "analyst_threat": "Renseignement Tactique des Menaces",
    "resident_risk": "Risque à Ma Position",
    "resident_weather": "Météo Hydrologique Locale",
    "resident_alerts": "Avis d'Urgence",
    "resident_guide": "Guide de Préparation",
    "resident_activity": "Lieux Enregistrés",
    "overview": "Vue d'Ensemble",
    "radar_overview": "Vue Radar Nationale",
    "gis_map": "Carte SIG Géospatiale",
    "disaster_catalog": "Catalogue des Sinistres (10k)",
    "climate_trends": "Tendances Climatiques (24 Ans)",
    "emergency_alerts": "Alertes d'Urgence et Sirène",
    "threat_command": "Commandement des Menaces",
    "mlops_benchmarks": "Performances MLOps",
    "operator_profile": "Profil de l'Opérateur",
    "system_settings": "Paramètres",
    "preferences": "Préférences",

    // Actions & Buttons
    "run_prediction": "Lancer une Prédiction",
    "view_live_map": "Voir la Carte en Direct",
    "enable_web_push": "Activer les Notifications Web",
    "trigger_sos": "Déclencher le SOS d'Urgence",
    "refresh": "Actualiser",
    "export_csv": "⬇ Exporter en CSV",
    "inspect_card": "Examiner le Document",
    "unlock_checkbox": "Débloquer le Consentement",
    "permissions_sensors": "Permissions et Capteurs",
    "change_district": "Changer de District / Secteur",
    "jump_to_screen": "Aller à un écran ou une action...",

    // Risk & Status
    "low_risk": "RISQUE FAIBLE",
    "medium_risk": "RISQUE MODÉRÉ",
    "high_risk": "RISQUE ÉLEVÉ",
    "very_high_risk": "RISQUE TRÈS ÉLEVÉ",
    "critical_risk": "RISQUE CRITIQUE",
    "active_monitoring": "Surveillance Active",
    "status": "Statut",
    "accuracy": "Exactitude",
    "precision": "Précision",
    "recall": "Rappel",
    "records": "Enregistrements",

    // Settings
    "appearance": "Apparence",
    "language_regional": "Langue et Région",
    "location_privacy": "Localisation et Confidentialité",
    "notification_channels": "Canaux de Notification",
    "weather_flood_risk": "Météo et Risque d'Inondation",
    "security_account": "Sécurité et Compte",
    "accessibility": "Accessibilité",
    "about_app": "Informations sur l'Application",
    "color_mode": "Mode de Couleur",
    "accent_theme": "Thème de Couleur d'Accent",
    "platform_language": "Langue de la Plateforme",
    "auto_fetch_phone": "Récupérer depuis SIM / Appareil",
    "phone_optional": "Numéro de Téléphone (Facultatif)"
  }
};

class I18nService {
  constructor() {
    this.currentLang = localStorage.getItem('floodai-lang') || 'en';
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(langCode) {
    if (!I18N_DICTIONARIES[langCode]) {
      langCode = 'en';
    }
    this.currentLang = langCode;
    try {
      localStorage.setItem('floodai-lang', langCode);
    } catch (_) {}
    document.documentElement.setAttribute('lang', langCode);
    this.translateDOM();
  }

  t(key, fallback = '') {
    const dict = I18N_DICTIONARIES[this.currentLang] || I18N_DICTIONARIES['en'];
    if (dict && dict[key] !== undefined) {
      return dict[key];
    }
    const enDict = I18N_DICTIONARIES['en'];
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  }

  /**
   * Scans DOM for data-i18n attributes or known translatable text and translates dynamically
   */
  translateDOM(root = document.body) {
    if (!root) return;

    // 1. Elements with data-i18n attribute
    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // 2. Elements with data-i18n-placeholder attribute
    const placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) el.placeholder = translation;
    });

    // 3. Known UI labels translation dictionary lookup for live content
    const directMapping = {
      "National Radar Overview": "radar_overview",
      "Overview": "overview",
      "Geospatial GIS Map": "gis_map",
      "Disaster Catalog (10k)": "disaster_catalog",
      "Climate Trends (24-Yr)": "climate_trends",
      "Emergency Alerts & Siren": "emergency_alerts",
      "Threat Command": "threat_command",
      "MLOps Benchmarks": "mlops_benchmarks",
      "Operator Profile": "operator_profile",
      "System Settings": "system_settings",
      "Settings": "system_settings",
      "Sign Out": "sign_out",
      "Sign In": "sign_in",
      "Platform Operations": "admin_ops",
      "User Administration": "admin_users",
      "System Configuration": "admin_config",
      "Alert Operations": "admin_alerts",
      "Audit Explorer": "admin_audit",
      "Prediction Workbench": "analyst_predict",
      "SHAP Attribution": "analyst_shap",
      "District Risk Matrix": "analyst_comparison",
      "Evaluation History": "analyst_history",
      "Tactical Threat Intel": "analyst_threat",
      "My Location Risk": "resident_risk",
      "Local Hydro Weather": "resident_weather",
      "Emergency Advisories": "resident_alerts",
      "Preparedness Guide": "resident_guide",
      "Saved Locations": "resident_activity",
      "LOW RISK": "low_risk",
      "MEDIUM RISK": "medium_risk",
      "HIGH RISK": "high_risk",
      "VERY HIGH RISK": "very_high_risk",
      "Active Monitoring": "active_monitoring",
      "Run a Prediction": "run_prediction",
      "View Live Map": "view_live_map",
      "Enable Web Push": "enable_web_push",
      "Trigger Emergency SOS Broadcast": "trigger_sos",
      "Permissions & Sensors": "permissions_sensors"
    };

    // Fast text-node scanner for active headings and labels
    root.querySelectorAll('.sidebar-label, .mobile-drawer-item span:not(:first-child), .page-title, .brand-text, .tag').forEach(node => {
      const trimmed = node.textContent?.trim();
      if (trimmed && directMapping[trimmed]) {
        const key = directMapping[trimmed];
        const translation = this.t(key);
        if (translation && translation !== trimmed) {
          node.textContent = translation;
        }
      }
    });
  }
}

// Global i18n instance
const i18nService = new I18nService();

// Helper function exported to global window
function t(key, fallback = '') {
  return i18nService.t(key, fallback);
}

function translateCurrentPage() {
  i18nService.translateDOM(document.body);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    i18nService.setLanguage(i18nService.getLanguage());
  });
}
