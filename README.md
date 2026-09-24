# 🏥 AccrediX — Portail d'Auto-Évaluation GRI 

**AccrediX** est une plateforme web d'évaluation et de pilotage de la **Gestion des Risques Infectieux (GRI)

Elle permet aux établissements de santé (hôpitaux publics, CHU, cliniques privées) de réaliser leur auto-évaluation sur les critères officiels de l', de soumettre leurs preuves documentaires, de bénéficier d'une assistance intelligente propulsée par IA (Groq), et permet à l' de superviser l'état d'avancement national en temps réel.

---

## 📁 Structure du Projet

L'arborescence du projet est organisée de manière modulaire et maintenable :

```
AccrediX/
│
├── 📂 public/              # Fichiers statiques servis au navigateur
│   ├── admin.html          # Dashboard national de supervision  (Administrateur)
│   ├── hospital.html       # Espace d'accueil et statut de l'établissement
│   ├── index.html          # Grille d'auto-évaluation GRI & intégration IA
│   ├── login.html          # Page d'authentification unique (Admin & Hôpitaux)
│   └── 📂 assets/
│       └── logo_.png  # Logo officiel de l'
│
├── 📂 server/              # Backend HTTP natif Node.js
│   └── server.js           # Serveur HTTP, routage API REST, auth JWT, proxy Groq & SMTP
│
├── 📂 data/                # Persistance des données (JSON)
│   ├── users.json          # Répertoire des comptes utilisateurs et rôles
│   ├── hospitals.json      # Liste des établissements de santé enregistrés
│   └── evaluations.json    # Résultats d'auto-évaluation et fils de discussion
│
├── 📂 scripts/             # Scripts utilitaires et d'exécution
│   ├── run.bat             # Lanceur batch sous Windows
│   └── test_email.js       # Script de test de connectivité SMTP
│
├── 📂 docs/                # Documents de référence et guides méthodologiques
│   └── .gitkeep            # Répertoire prêt à accueillir vos documents et référentiels
│
├── .env                    # Variables d'environnement locales (clés privées, ignoré par git)
├── .env.example            # Gabarit des variables d'environnement à configurer
├── .gitignore              # Règles d'exclusion Git (node_modules, .env, logs)
├── package.json            # Dépendances Node.js (dotenv, nodemailer)
├── README.md               # Documentation générale du projet
└── run.bat                 # Lanceur rapide à la racine du projet
```

---

## 🚀 Installation & Démarrage

### Prérequis
- **Node.js** (version 18 ou supérieure recommandée). Téléchargeable sur [nodejs.org](https://nodejs.org).

### 1. Installation des dépendances
Ouvrez un terminal dans le dossier du projet et exécutez :
```bash
npm install
```

### 2. Configuration des variables d'environnement
Un fichier `.env` est déjà présent ou peut être créé à partir du modèle `.env.example` :
```bash
cp .env.example .env
```
Paramètres configurables :
- `PORT` : Port d'écoute du serveur (par défaut : `3001`).
- `GROQ_API_KEY` : Clé d'API Groq Cloud pour l'analyse IA des critères GRI.
- `SMTP_HOST` / `SMTP_PORT` : Serveur de messagerie (ex : `smtp.gmail.com` sur le port `465`).
- `SMTP_USER` / `SMTP_PASS` : Identifiants d'envoi d'e-mails officiels (mot de passe d'application).

### 3. Lancement du serveur

Vous pouvez démarrer le serveur de deux façons :

- **Via le script Windows** : Double-cliquez sur `run.bat` (à la racine ou dans `scripts/`). Le navigateur s'ouvrira automatiquement sur [http://localhost:3001](http://localhost:3001).
- **Via la ligne de commande** :
```bash
node server/server.js
```
Puis accédez à votre navigateur : **`http://localhost:3001`** (redirection automatique vers `/login.html`).

---

## 👥 Comptes de Démonstration

Pour vos présentations et tests, les comptes suivants sont préconfigurés dans `data/users.json` :

### 🛡️ Compte Administrateur ()
| Rôle | Identifiant (Username) | Mot de passe | Accès / Permissions |
| :--- | :--- | :--- | :--- |
| **Admin National** | `admin` | `adminpassword` | Vue globale de tous les hôpitaux, création d'établissements, statistiques, messagerie |

### 🏥 Comptes Établissements de Santé (Hôpitaux)
| Identifiant | Mot de passe | Établissement | Ville / Type |
| :--- | :--- | :--- | :--- |
| `h1` | `hospitalpass1` | CHU Charles Nicolle | Tunis (CHU) |
| `h2` | `hospitalpass2` | CHU La Rabta | Tunis (CHU) |
| `h4` | `hospitalpass4` | CHU Sahloul | Sousse (CHU) |
| `h5` | `hospitalpass5` | CHU Farhat Hached | Sousse (CHU) |
| `h6` | `hospitalpass6` | CHU Hédi Chaker | Sfax (CHU) |
| `h7` | `hospitalpass7` | CHU Habib Bourguiba | Sfax (CHU) |
| `h8` | `hospitalpass8` | CHU Fattouma Bourguiba | Monastir (CHU) |
| `h9` | `hospitalpass9` | Hôpital Régional Menzel Bourguiba | Bizerte (Régional) |
| `h10` | `hospitalpass10` | Hôpital Régional Mohamed Tlatli | Nabeul (Régional) |
| `h11` | `hospitalpass11` | CHU Taher Sfar | Mahdia (CHU) |
| `h12` | `hospitalpass12` | Clinique Taoufik | Tunis (Privé) |
| `h13` | `hospitalpass13` | Polyclinique Les Jasmins | Tunis (Privé) |

---

## 🔄 Flux Utilisateur & Parcours Fonctionnel

```
               ┌───────────────────────────────┐
               │    Page de Connexion (Login)  │
               │         /login.html           │
               └───────────────┬───────────────┘
                               │
            ┌──────────────────┴──────────────────┐
     (Rôle: admin)                        (Rôle: hospital)
            │                                     │
            ▼                                     ▼
┌─────────────────────────┐           ┌─────────────────────────┐
│   Dashboard National    │           │    Portail Établissement│
│      /admin.html        │           │     /hospital.html      │
├─────────────────────────┤           ├─────────────────────────┤
│ • Suivi global hôpitaux │           │ • Délais légaux restant │
│ • Niveaux de maturité   │           │ • Statut de conformité  │
│ • Ajout nouvel hôpital  │           │ • Accès auto-évaluation │
│ • Notification par mail │           └───────────┬─────────────┘
│ • Discussions globales  │                       │
└─────────────────────────┘                       ▼
                                      ┌─────────────────────────┐
                                      │ Auto-Évaluation GRI     │
                                      │       /index.html       │
                                      ├─────────────────────────┤
                                      │ • Évaluation critères   │
                                      │ • Import & lecture PDF  │
                                      │ • Recommandations IA    │
                                      │ • Échange direct   │
                                      │ • Export du rapport     │
                                      └─────────────────────────┘
```

1. **Connexion (`/login.html`)** : Authentification sécurisée par jeton HMAC SHA-256 avec distinction automatique du rôle.
2. **Espace Établissement (`/hospital.html`)** : Présentation du statut de conformité de l'hôpital, indicateur de compte à rebours (délai réglementaire de 15 jours) et raccourci d'évaluation.
3. **Plateforme d'Auto-Évaluation GRI (`/index.html`)** :
   - Évaluation détaillée des critères de référence du guide GRI (9 Références).
   - Analyse automatique de documents de preuve au format PDF via `pdf.js`.
   - Recommandations personnalisées assistées par LLM (Groq API).
   - Fil de discussion direct entre l'hôpital et les évaluateurs .
   - **Rapport Officiel d'Accréditation ** : Générateur de document officiel au format ministériel A4 (en-tête République Tunisienne/, logo officiel, matrice des 9 références, synthèses détaillées, analyse stratégique, conclusions institutionnelles avec recommandations, et doubles cadres de signatures/cachets).
4. **Dashboard Superviseur  (`/admin.html`)** :
   - Vue matricielle de tous les établissements tunisiens inscrits.
   - Statistiques de taux de conformité, calcul automatique de niveau (1 à 5).
   - Accès direct au dossier d'évaluation et au **Rapport Officiel** de chaque établissement.
   - Enregistrement immédiat d'un nouvel établissement avec envoi automatique d'e-mail d'accès.

---

## 🛠️ Caractéristiques Techniques

- **Serveur** : Node.js standard (`http`, `fs`, `path`, `crypto`) sans framework lourd pour une portabilité maximale et un déploiement ultra-léger.
- **Frontend** : HTML5, CSS moderne avec design épuré conforme à l'identité visuelle de l', Vanilla JavaScript interactif.
- **Sécurité** : Tokens HMAC SHA-256 avec expiration, variables sensibles isolées dans `.env`, filtrage anti-traversée de répertoire pour les fichiers statiques.
- **Persistance** : Fichiers JSON structurés dans le dossier `data/`.
