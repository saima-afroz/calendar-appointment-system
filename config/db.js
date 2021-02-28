const serviceAccount = require('../calendar-appointment-sys-21554-firebase-adminsdk-bs60r-878e2d2ff1.json');
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


module.exports = {
    db
}