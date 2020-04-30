'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const postPreference = functions.region('europe-west1').https.onRequest((request, response) => {
  const postData = Object.assign({}, request.body);
  console.log("Got postData", postData);
  admin.firestore().collection('users').doc(postData.me).set({
    'preferences': postData.preferences,
    'me': postData.me
  })
    .then(function(doc) {
      console.log("Saved doc", doc);
      response.send("Success\n\n");
    })
    .catch(function(error) {
      console.log("Unable to save doc", error);
      response.send("Error\n\n");
    });
});
