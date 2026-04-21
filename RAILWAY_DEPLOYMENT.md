# Guide de Déploiement Railway

Ce guide vous explique comment connecter votre dépôt GitHub à Railway et configurer le déploiement automatique.

---

## Étape 1: Créer un Compte Railway

1. Allez sur [railway.app](https://railway.app)
2. Cliquez sur **"Start Project"** (en haut à droite)
3. Choisissez **"Deploy from GitHub"**
4. Connectez-vous avec votre compte GitHub (ou créez un compte Railway)

---

## Étape 2: Autoriser Railway à Accéder à GitHub

1. Vous serez redirigé vers GitHub pour autoriser Railway
2. Cliquez sur **"Authorize railwayapp"**
3. Entrez votre mot de passe GitHub si demandé
4. Acceptez les permissions

**Permissions demandées:**
- Accès aux dépôts publics et privés
- Accès aux webhooks (pour les déploiements automatiques)

---

## Étape 3: Sélectionner Votre Dépôt

1. De retour sur Railway, vous verrez une liste de vos dépôts GitHub
2. Cherchez **"urea-delivery-tracker"**
3. Cliquez sur le dépôt pour le sélectionner
4. Cliquez sur **"Deploy Now"**

---

## Étape 4: Configurer le Projet Railway

### 4.1 Attendre le Déploiement Initial

Railway va:
1. Cloner votre dépôt
2. Détecter le `Procfile`
3. Exécuter `pnpm build`
4. Exécuter `pnpm start`

**Cela prendra 5-10 minutes la première fois.**

### 4.2 Vérifier le Statut

- Allez sur votre **Dashboard Railway**
- Cliquez sur votre projet **"urea-delivery-tracker"**
- Vous verrez l'onglet **"Deployments"** avec le statut

**Statuts possibles:**
- 🟡 **Building** - En cours de construction
- 🟢 **Success** - Déploiement réussi
- 🔴 **Failed** - Erreur lors du déploiement

---

## Étape 5: Configurer les Variables d'Environnement

### 5.1 Accéder aux Variables d'Environnement

1. Dans le Dashboard Railway, cliquez sur votre projet
2. Allez à l'onglet **"Variables"**
3. Cliquez sur **"Add Variable"**

### 5.2 Ajouter les Variables Requises

Ajoutez ces variables d'environnement:

| Variable | Valeur | Description |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql://user:password@host:5432/db` | Chaîne de connexion PostgreSQL |
| `NODE_ENV` | `production` | Mode production |

**Exemple de DATABASE_URL:**
```
postgresql://postgres:mypassword@db.railway.internal:5432/railway
```

### 5.3 Ajouter une Base de Données PostgreSQL

1. Cliquez sur le **"+"** en haut à droite du Dashboard
2. Cherchez **"PostgreSQL"**
3. Cliquez sur **"PostgreSQL"** pour l'ajouter
4. Railway créera automatiquement une base de données
5. La variable `DATABASE_URL` sera automatiquement définie

---

## Étape 6: Déclencher un Déploiement

### Option 1: Déploiement Automatique (Recommandé)

Chaque fois que vous poussez du code sur GitHub:

```bash
git add .
git commit -m "Mise à jour de l'application"
git push origin main
```

Railway détectera automatiquement le changement et déploiera!

### Option 2: Déploiement Manuel

1. Allez sur le Dashboard Railway
2. Cliquez sur votre projet
3. Cliquez sur **"Redeploy"** (en haut à droite)

---

## Étape 7: Vérifier le Déploiement

### 7.1 Accéder à Votre Application

1. Dans le Dashboard, cliquez sur votre projet
2. Allez à l'onglet **"Deployments"**
3. Cliquez sur le déploiement réussi
4. Cherchez le lien **"Public URL"** ou **"Domain"**
5. Cliquez sur le lien pour accéder à votre app

**Exemple:** `https://urea-tracker-production.up.railway.app`

### 7.2 Tester l'API

```bash
# Remplacez YOUR_DOMAIN par votre domaine Railway
curl https://YOUR_DOMAIN/api/trpc/auth.me
```

Vous devriez voir une réponse JSON.

### 7.3 Vérifier les Logs

1. Dans le Dashboard, cliquez sur votre projet
2. Allez à l'onglet **"Logs"**
3. Vous verrez tous les logs du serveur en temps réel

---

## Étape 8: Configurer un Domaine Personnalisé (Optionnel)

### 8.1 Ajouter un Domaine

1. Allez à l'onglet **"Settings"** de votre projet
2. Cherchez **"Domains"**
3. Cliquez sur **"Add Domain"**
4. Entrez votre domaine (ex: `app.monentreprise.com`)

### 8.2 Configurer les Enregistrements DNS

Railway vous donnera les enregistrements DNS à ajouter:

**Type A:**
```
Nom: app
Valeur: 1.2.3.4 (IP Railway)
```

**Type CNAME:**
```
Nom: app
Valeur: cname.railway.app
```

Allez sur votre registraire de domaine (GoDaddy, Namecheap, etc.) et ajoutez ces enregistrements.

---

## Étape 9: Configurer les Webhooks GitHub (Optionnel)

Railway configure automatiquement les webhooks GitHub, mais vous pouvez vérifier:

### 9.1 Vérifier sur GitHub

1. Allez sur votre dépôt GitHub
2. Allez à **Settings** → **Webhooks**
3. Vous devriez voir un webhook de Railway

### 9.2 Vérifier sur Railway

1. Allez à votre profil Railway
2. Allez à **Integrations**
3. Vérifiez que GitHub est connecté

---

## Dépannage

### Problème: "Build Failed"

**Solution:**
1. Allez à l'onglet **"Logs"**
2. Cherchez le message d'erreur
3. Vérifications courantes:
   - Vérifiez que `Procfile` existe
   - Vérifiez que `pnpm build` fonctionne localement
   - Vérifiez que toutes les dépendances sont dans `package.json`

### Problème: "DATABASE_URL not set"

**Solution:**
1. Allez à l'onglet **"Variables"**
2. Vérifiez que `DATABASE_URL` est défini
3. Si vous avez ajouté PostgreSQL, la variable devrait être automatique
4. Redéployez après avoir ajouté la variable

### Problème: "Port 3000 not accessible"

**Solution:**
1. Vérifiez que votre serveur écoute sur le port 3000
2. Vérifiez que `NODE_ENV=production` est défini
3. Vérifiez les logs pour les erreurs de démarrage

### Problème: "Migrations failed"

**Solution:**
1. Vérifiez que `DATABASE_URL` est correct
2. Vérifiez que PostgreSQL est connectée
3. Vérifiez les logs pour les erreurs SQL
4. Essayez de redéployer

### Problème: "Application keeps crashing"

**Solution:**
1. Allez à l'onglet **"Logs"**
2. Cherchez les erreurs
3. Vérifications:
   - Toutes les variables d'environnement sont-elles définies?
   - La base de données est-elle accessible?
   - Y a-t-il des erreurs TypeScript?

---

## Workflow de Déploiement Complet

### Développement Local

```bash
# 1. Faire des changements
nano app/(tabs)/index.tsx

# 2. Tester localement
pnpm dev

# 3. Vérifier les types
pnpm run check

# 4. Exécuter les tests
pnpm test

# 5. Commiter et pousser
git add .
git commit -m "Ajout de nouvelle fonctionnalité"
git push origin main
```

### Déploiement Automatique

```
GitHub push
    ↓
Webhook GitHub → Railway
    ↓
Railway détecte le changement
    ↓
Railway exécute: pnpm build
    ↓
Railway exécute: pnpm start
    ↓
Application en ligne! 🚀
```

---

## Monitoring et Maintenance

### Vérifier les Logs

```bash
# Dans le Dashboard Railway
Onglet "Logs" → Voir tous les logs en temps réel
```

### Redéployer Manuellement

```bash
# Dans le Dashboard Railway
Cliquez sur "Redeploy" (en haut à droite)
```

### Arrêter l'Application

```bash
# Dans le Dashboard Railway
Cliquez sur "Stop" (en haut à droite)
```

### Supprimer le Projet

```bash
# Dans le Dashboard Railway
Allez à "Settings" → "Delete Project"
```

---

## Commandes Utiles

### Voir l'Historique des Déploiements

```bash
# Dans le Dashboard Railway
Onglet "Deployments" → Voir tous les déploiements
```

### Voir les Métriques

```bash
# Dans le Dashboard Railway
Onglet "Metrics" → CPU, Mémoire, Réseau
```

### Accéder à la Console

```bash
# Dans le Dashboard Railway
Onglet "Logs" → Cliquez sur "Console"
```

---

## Coûts Railway

Railway offre:
- **Crédit gratuit:** $5/mois pour les nouveaux utilisateurs
- **Pricing:** Environ $0.50/heure pour une application simple
- **Base de données PostgreSQL:** Incluse dans les crédits

**Estimation pour votre app:**
- Serveur Node.js: ~$0.20/heure
- PostgreSQL: ~$0.10/heure
- **Total:** ~$72/mois (si utilisé 24/7)

---

## Prochaines Étapes

1. ✅ Créer un compte Railway
2. ✅ Connecter votre dépôt GitHub
3. ✅ Configurer les variables d'environnement
4. ✅ Ajouter une base de données PostgreSQL
5. ✅ Déclencher un déploiement
6. ✅ Vérifier que l'application fonctionne
7. ✅ Configurer un domaine personnalisé (optionnel)

---

## Support

- **Documentation Railway:** https://docs.railway.app
- **Discord Railway:** https://discord.gg/railway
- **Status Page:** https://status.railway.app

---

**Bon déploiement! 🚀**
