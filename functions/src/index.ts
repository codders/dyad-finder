'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as express from 'express';

admin.initializeApp();

const app = express();

app.post('/group/:id', (req, res) => {
  const postData = Object.assign({}, req.body);
  console.log("Got postData", postData);
  admin.firestore().collection('groups').doc(req.params.id).set({
    members: postData.members
  })
    .then(doc => {
      console.log("Created group", doc);
      res.send("Success");
    })
    .catch(error => {
      console.log("Unable to create group", error);
      res.send("Error");
    });
});

app.delete('/group/:id', (req, res) => {
  console.log("Deleting group", req.params.id);
  admin.firestore().collection('groups').doc(req.params.id).collection('preferences').get()
    .then((snapshot) => {
      if (snapshot.size === 0) {
        return 0;
      }

      const batch = admin.firestore().batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    })
    .then(deleted => {
      return admin.firestore().collection('groups').doc(req.params.id).delete()
        .then(ref => {
          res.send("Deleted: " + deleted);
        });
    })
    .catch(error => {
      console.log("error deleting group " + req.params.id, error);
      res.send("Error");
    });
});

app.post('/group/:id/preference', (req, res) => {
  const postData = Object.assign({}, req.body);
  console.log("Got postData", postData);
  admin.firestore().collection('groups').doc(req.params.id).collection('preferences').doc(postData.me).set({
    'preferences': postData.preferences,
    'me': postData.me
  })
    .then(function(doc) {
      console.log("Saved doc", doc);
      res.send("Success\n\n");
    })
    .catch(function(error) {
      console.log("Unable to save doc", error);
      res.send("Error\n\n");
    });
});

exports.dyad = functions.region('europe-west1').https.onRequest(app);
