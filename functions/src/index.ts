'use strict';

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

import * as express from 'express';
import * as cors from 'cors';

import * as solver from './solver';

admin.initializeApp();

const app = express();

app.use(cors());

app.post('/group/:id', (req, res) => {
  const postData = Object.assign({}, req.body);
  console.log("Got postData", postData);
  admin.firestore().collection('groups').doc(req.params.id).set({
    members: postData.members
  })
    .then(doc => {
      console.log("Created group", doc);
      res.status(201).json({ members: postData.members });
    })
    .catch(error => {
      console.log("Unable to create group", error);
      res.status(500).json({ error: error.message });
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
          res.status(200).json({ "result": "deleted" });
        });
    })
    .catch(error => {
      console.log("error deleting group " + req.params.id, error);
      res.status(500).json({ error: error.message });
    });
});

interface PreferenceRecord {
  student_prefs: { [key: string]: string[] }[]
};

const preferencesForGroup = (groupId: string): Promise<PreferenceRecord> => {
  return admin.firestore().collection('groups').doc(groupId).collection('preferences').get()
    .then((snapshot) => {
      if (snapshot.size === 0) {
        return { "student_prefs": [ {} ] };
      } else {
        const preferenceHash: { [key: string]: string[] } = {};
        const result = {
          "student_prefs": [ preferenceHash ]
        };
        snapshot.forEach(function(doc) {
          const data = doc.data();
          const proposer = data.me as string;
          result["student_prefs"][0][proposer] = data.preferences;
        });
        return result;
      }
    })
};

app.get('/group/:id/preferences', (req, res) => {
  preferencesForGroup(req.params.id).then(result => {
    res.status(200).json({ "preferences": Object.keys(result.student_prefs[0]) });
  })
    .catch(error => {
      console.log("Unable to get preferences for group " + req.params.id, error);
      res.status(500).json({ error: error.message });
    });
});

app.get('/group/:id/raw_preferences', (req, res) => {
  preferencesForGroup(req.params.id).then(result => {
    res.send(result);
  })
    .catch(error => {
      console.log("Unable to get match result for group " + req.params.id, error);
      res.status(500).json({ error: error.message });
    });
});

interface GroupRecord {
  members: string[]
};

app.get('/group/:id', (req, res) => {
  return admin.firestore().collection('groups').doc(req.params.id).get()
    .then(doc => {
      if (!doc.exists) {
        res.status(200).json({ members: [] });
      } else {
        const data = doc.data() as GroupRecord;
        res.status(200).json(data);
      }
    })
    .catch(function(error) {
      console.log("Unable to read group " + req.params.id, error);
      res.status(500).json({ error: error.message });
    });
})

app.get('/group/:id/matches', (req, res) => {
  return preferencesForGroup(req.params.id).then(result => {
    res.status(200).send(solver.solve(result));
  })
    .catch(error => {
      console.log("Unable to get match result for group " + req.params.id, error);
      res.status(500).json({ error: error.message });
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
      res.status(201).json({
        'me': postData.me,
        'preferences': postData.preferences
      });
    })
    .catch(function(error) {
      console.log("Unable to save doc", error);
      res.status(500).json({ error: error.message });
    });
});

exports.dyad = functions.region('europe-west1').https.onRequest(app);
