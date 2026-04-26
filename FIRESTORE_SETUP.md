# Configuração das Regras do Firestore - Loja

## ⚠️ PROBLEMA IDENTIFICADO

Suas regras estão com erro de indentação! Os blocos `match` para `questions`, `shopItems` e `purchases` estão **FORA** do bloco principal.

## ✅ Corrija assim no Firebase Console:

Suas regras devem ficar **EXATAMENTE** assim (note a indentação):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }

    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /shopItems/{itemId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null && 
        request.auth.uid == itemId.split('_')[0];
    }

    match /purchases/{purchaseId} {
      allow read: if request.auth != null && 
        request.auth.uid == purchaseId.split('_')[0];
      allow create: if request.auth != null && 
        request.auth.uid == purchaseId.split('_')[0];
      allow update, delete: if false;
    }

  }
}
```

## Passos:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Firestore Database** → **Regras**
3. **SUBSTITUA TUDO** pelo código correto acima (com indentação correta!)
4. Clique em **Publicar**

## ✅ Problema de Índice Resolvido

O código foi atualizado para **não requerer índice composto**. A ordenação agora é feita no cliente.
