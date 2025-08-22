# 🌌 ORION – MDD (Monde de Dév) – MVP

MDD est le **réseau social des développeurs** imaginé par **ORION**.  
Objectif : faciliter la mise en relation, encourager la collaboration et créer un vivier de talents tech.  

Ce MVP permet :  
- de **s’inscrire / se connecter** (authentification JWT en cookie HTTP-only)  
- de **s’abonner à des topics** (Java, Angular, Spring, etc.)  
- de voir un **fil chronologique** des posts liés aux topics suivis  
- de **publier des posts** et **commenter**  

---

## Stack technique
- **Front-end** : Angular 15, RxJS, Angular Material, tests Karma/Jasmine (+ Cypress pour E2E)  
- **Back-end** : Spring Boot 3, Java 17, MariaDB/MySQL, JPA/Hibernate, JWT, Swagger/OpenAPI  

---

## Prérequis
- Node.js ≥ 16 + npm  
- Angular CLI : `npm i -g @angular/cli`  
- Java 17 + Maven ≥ 3.8  
- MariaDB/MySQL (DB `mdd`)  

---

## 🏁 Installation & lancement

### 1) Back-end (Spring Boot)
```bash
cd back

# Créer la base si nécessaire
# CREATE DATABASE mdd CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Build & lancement
mvn clean install
mvn spring-boot:run

# → API : http://localhost:8080/api
# → Swagger : http://localhost:8080/swagger-ui/index.html
```

👉 Des données de démo (utilisateur + topics) sont injectées via `src/main/resources/data.sql`.

---

### 2) Front-end (Angular)
```bash
cd front
npm ci          # ou npm install
npm start       # alias ng serve

# → App : http://localhost:4200
```

👉 Vérifier que `src/environments/environment.ts` pointe vers le back :
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

---

## Lancer les tests

### Front
```bash
cd front
ng test --watch=false --code-coverage
# Rapport dans front/coverage
```

### Front E2E (Cypress, si specs ajoutées)
```bash
cd front
npx cypress open   # mode GUI
npx cypress run    # mode headless
```

### Back
```bash
cd back
mvn test
```

---

## Architecture – Front (Angular)

```
front/src/app
├─ app.routes.ts / app-routing.module.ts
├─ components/         # UI partagée (navbar, etc.)
├─ pages/
│  ├─ home/            # accueil
│  ├─ login/           # connexion
│  ├─ register/        # inscription
│  ├─ profile/         # profil utilisateur
│  ├─ topics/          # gestion abonnements aux topics
│  └─ posts/           # CRUD posts + détails + commentaires
├─ services/
│  ├─ auth.service.ts      # login/register, session
│  ├─ topic.service.ts     # topics + subscribe/unsubscribe
│  ├─ post.service.ts      # posts + commentaires
│  └─ user.service.ts      # profil utilisateur
└─ guards/
   ├─ auth.guard.ts        # protège les routes privées
   └─ auth-redirect.guard.ts # redirige si déjà connecté
```

- Composants **standalone**  
- Services centralisant les appels HTTP (API MDD)  
- Guards pour sécuriser le routing  
- Tests unitaires Karma/Jasmine + possibilité E2E Cypress  

---

## Architecture – Back (Spring Boot)

```
back/src/main/java/com/openclassrooms/mddapi
├─ config/          # sécurité (JWT, CORS) + Swagger
├─ controller/      # endpoints REST (auth, users, topics, posts, feed)
├─ dto/             # objets d’échange (PostDto, TopicDto, etc.)
├─ model/           # entités JPA (User, Post, Comment, Topic, Subscription)
├─ repository/      # interfaces Spring Data JPA
├─ security/        # JwtUtils, filtres, UserDetailsImpl
└─ service/         # logique métier (AuthService, PostService, etc.)
```

- **Relations principales** :  
  - User ↔ Post ↔ Comment  
  - User ↔ Subscription ↔ Topic  
  - Topic ↔ Post  

- **Sécurité** : JWT stocké en cookie HTTP-only, vérifié via `JwtCookieAuthFilter`  
- **Swagger/OpenAPI** exposé pour documentation et test d’API  

---

## Endpoints principaux

- `POST /api/auth/register` — inscription  
- `POST /api/auth/login` — connexion (cookie JWT)  
- `POST /api/auth/logout` — déconnexion  
- `GET  /api/topics` — liste des topics  
- `POST /api/topics/{id}/subscribe` — suivre un topic  
- `DELETE /api/topics/{id}/subscribe` — se désabonner  
- `GET  /api/feed` — fil des posts des topics suivis  
- `POST /api/posts` — créer un post  
- `GET  /api/posts/{id}` — détail d’un post  
- `POST /api/posts/{id}/comments` — commenter  

---

## Checklist dev
- [ ] Base `mdd` créée et accessible  
- [ ] Back lancé (`mvn spring-boot:run`) sur `:8080`  
- [ ] Front lancé (`npm start`) sur `:4200`  
- [ ] `environment.ts` → `http://localhost:8080/api`  
- [ ] Tests front (`ng test`) & back (`mvn test`) passent  

---

## Équipe
- Orlando — Responsable  
- Heidi — Développeuse  
- Juana — UX Designer  
- Sébastien — Développeur Full-Stack

---
