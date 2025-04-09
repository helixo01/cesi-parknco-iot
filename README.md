# Simulateur de Parking CESI

Ce projet simule l'occupation de deux parkings du CESI en temps réel et envoie les données à une base de données InfluxDB.

## 🏢 Parkings Simulés

### Parking CESI Intérieur
- **Capacité totale** : 50 places
- **Types de places** :
  - 42 places normales
  - 3 places handicapées
  - 5 places électriques

### Parking Étudiant
- **Capacité totale** : 200 places
- **Types de places** :
  - 200 places normales

## ⏰ Périodes d'Occupation

### En Semaine
- **Nuit (18h00 - 7h30)** : 2% d'occupation
- **Matin (7h30 - 9h00)** : Remplissage progressif
- **Midi (11h45 - 12h30)** : 70% d'occupation
- **Après-midi (12h30 - 13h30)** : 90% d'occupation
- **Fin de journée (16h30 - 18h00)** : Vidage progressif
- **Pendant la journée (9h00 - 16h30)** : 90% d'occupation avec variations

### Weekend
- Occupation constante de 2%

## 📊 Variations d'Occupation

- **En semaine** : Maximum 1% de variation par minute
- **Nuit et weekend** : Maximum 0.1% de variation par minute
- Les changements sont progressifs pour éviter les sauts brusques

## 🚀 Installation

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/cesi-parknco-iot.git
cd cesi-parknco-iot
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les variables d'environnement**
Créer un fichier `.env` à la racine du projet :
```env
INFLUXDB_URL=votre_url_influxdb
INFLUXDB_TOKEN=votre_token
INFLUXDB_ORG=CESI
INFLUXDB_BUCKET=parking
```

## 💻 Utilisation

### Développement Local
```bash
npm run dev
```

### Production
```bash
npm start
```

## 📡 Données Envoyées à InfluxDB

### Tags
- `parking_name` : Nom du parking (CESI_INTERIEUR ou PARKING_ETUDIANT)
- `space_type` : Type de place (normal, handicape, electrique)
- `is_weekend` : Indicateur weekend (true/false)

### Mesures
- `occupied_spaces` : Nombre de places occupées
- `available_spaces` : Nombre de places disponibles
- `total_spaces` : Nombre total de places
- `occupation_rate` : Taux d'occupation (en pourcentage)

## 🕒 Fuseau Horaire

Le simulateur utilise le fuseau horaire de Paris (Europe/Paris) pour tous les calculs et affichages.

## 📝 Logs

Les logs affichent :
- Date et heure (fuseau de Paris)
- Période (Semaine/Weekend)
- État de chaque parking
- Nombre de places par type
- Taux d'occupation

## 🔄 Mise à Jour des Données

Les données sont mises à jour et envoyées à InfluxDB toutes les minutes.

## 🛠 Technologies Utilisées

- TypeScript
- Node.js
- InfluxDB
- Railway (déploiement)

## 📦 Structure du Projet

```
cesi-parknco-iot/
├── src/
│   ├── services/
│   │   └── influxdb.ts
│   └── parkingSimulator.ts
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```