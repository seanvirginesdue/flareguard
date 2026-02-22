import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId:"flareguard-97905",
      clientEmail:
        "firebase-adminsdk-fbsvc@flareguard-97905.iam.gserviceaccount.com",
      privateKey:
        "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCM8QFIfh5KLcwp\nT7DFFRPMK8oks3IRzJ/IaEcxoOjI4zqRVxFIoB4vJ1dX80mCoHW65q/Stbh612Zd\n9/YrbCWgTGr0J42l4yjL6nhR7rVnCT1g4Ndue0eAQvAXaE++k19RsZzVRoClqxUo\ngxM+VYHnqaPcAeyvf6v3o5I5ptfd1zuYQZ6/4sbcr/2ppi2VlUl7k2f9MSHatn6Z\nO4iz2Dp+9mbnZbIxQNc6OBe+npUrVLzIPz8T8PT8UUQc5yO5gEN/vPu+Tz689VOn\niL9mfxQRu4LgRxAfNoG/DGhqv9/0Cgptbz7u4W3HDBCA82DU1drOKTOtcSLLBWN/\njQklHIJNAgMBAAECggEAGfA/1XTag7nefUrchETfBiAX/X2l9Gclj+c7FQPhW5lQ\nHc/5jxViwLhbj4TnhjocOKe8e4m0mCz8urYIENFAMnpl46XE4J8IEtFF0ARfz8To\nTiRLGZroG4+WKqSoqnDqZblLnQey5OpxxCktWTc452b10GdtRRY40qRApMoTJ9Ev\nA0E0xHctqQlQiBCBUcHcScFkGd2wkcOFcH1nzUYNZfsoEtd2e6BC5xtRwPefyee2\nrgE8RfJlc+HjAhZtriG2Lv2f05HujwH9XtDkh32XrrkOsAKxFxXDHblBNDaVpnDR\nJ3lf5aOEwQgJfaaFFDcjQj4wOvFCi4Mqn9a84a5KwQKBgQDEMg0Rb+WBxD4shhAp\ngKgXhyVhP4JpnAHfPCo5TKrbvAWtPPe0gKhAd6gqjWWWnIgj5IrbkmjlkIStmYr9\n1MisqnfZjjEZysJipNOQvZVzuRfhi+9qn4xtR8m8HRA7pcus49z7twAV+yS5QKDA\nrCvkf44dr+tbWctuELfpv/MWDQKBgQC35z+lmytfjEJjZHWc9xM4AGArYWU1UyjC\n6kk/bWukAeBoSgUGxw1eRGVnu+jLq5XnZsKb3XbGTOTIDYUmJvO5OVFyq0UzbZmg\nEV+6eKpktpYnewnBABrzQRznm1ZBccJQWblqMUEpAUMvrFuWm5/gISSabRz7HTPo\nHThS10pNQQKBgQCxPVoK56BZU7SrOk19gMnZv3BoYxxoVdRnHA41B2rO6RPjxdEs\n0pGs86wLDQO6RRzD+CHtbF2xDZae0bf7yW+kdLei5U68MyzaOncaKfrKuWq2ilk2\nZH5S9uhrNYJFsGjIfm1TRKYiNWiepqDSjnd0jDsR3KvtMbiSbS4IUCzFPQKBgAeF\nNV0YU1W87poR6Z1ZnTeVDFm5yeG8XNZbrlMhrl0ulnatUDdOvIU2Vs8/J+3sPl0Q\nHrUxAUJqspBbvS4qOZ1Bcss1pcbMnJOnIjsF5DHqJYnHxkZWMsPvzbbK62QRuth+\nUs685OVAX/b7HWOzSX5o3I5UF/NM5mp/h2Yb17YBAoGAAPNaTl3gnhLbmxsxM0+B\nhhKN54gH4z4/iYFcQvomXeL07M7Bg327QcDhvl01tfJ2czYMQ9Iwatv+i26nAXWQ\n6BizXVlpHlfY0AOE8DgeXZGuTW8wTaJg/TF4bn9HdCxNzT0/QekRpVfH58LvjNqd\nQttE+XI5ht6LLj6fpZ28VjE=\n-----END PRIVATE KEY-----\n",
    }),
  });
}

export const adminAuth = admin.auth();
