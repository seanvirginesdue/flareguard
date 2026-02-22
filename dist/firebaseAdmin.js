import * as admin from "firebase-admin";
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: "flareguard-459ec",
            clientEmail: "firebase-adminsdk-fbsvc@flareguard-459ec.iam.gserviceaccount.com",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCp8afWByODiqhG\nGPSycxzgIL8zl4nEgfynOZvld0LSXAAQbMFVc1aBLipe1pVApeGxwROYMVX22kV/\nAZYuZvk/O1LBZ5+QK3aysshF88gKJTflDmEUB9Z7qteoDuUBAJ1733tA8cWEsRtq\nr36s31/56n16HpTy44cL+PcMsKRC73yawuhsQENIFs/N4n4O5HQ/VKb8wVvzEnRP\nyXrNcyj0/7WG+LRmW7jeHlNBrtwv6hDnHQGse1Evt27Tba6gTenEMzcqph/08XsK\n/ucxguJ8lniVjpPCwm3D7FkkPzkRrHgVYxrZwvjGmz7BIeswuV/hvCBVuNcI4qdx\nEuV2N57zAgMBAAECggEAC7vYt8lkZVe0iKp+crfJ/ZulN/21kHDdLfqnTe+vGHEr\nu/aWXr0I8wBqAoRUZ9NMQwauwKpfYhzuAXftk6SefwQskZgDB2RI3MvFUjcjz7eE\nJXeZslVcNMu1+i+VFj2hogTrMK/A0Imd9/7IA02lBc9v/HeSFzcoguYcwK6NmOVt\nYLuBsvqvl2zcBhrYcJvAP7/YDNkcncjnO5iGyyJ/WDaLmXQyI6AdaMpV8OxcjeDx\n4RV1gK5TRBcYyPm/UkOKetvqzsQwwY6pcSXZBYFcFC3v+ecfpoU2sfS1skmCBIcJ\nyrc81FHK3n0o+Y8WcmlnSXcHywmMM8ZPIuw5XjM/mQKBgQDbjSFNpEDKSBlxniko\nxlYP78z2G3ss+THT1ufr8Ky85IcRInBCE1es6+LLRhpRnnCBn9/J0evbFiYOEOVg\n0peh7Gt9rryD9wwmqkV/THtzWBpIE9BPv2Xao2v2XCGH2/jIlDfAkaP5WVTQjY4l\n4L36Y5gOlZIfK4eFRLWo0e5plQKBgQDGKDpU4lcEkCw+Ks8yWenwBYZ1J5ZSyyyM\nh5ql6EzCeFkyghOWJWb+X6mHAZ3ZXPIFSo7SdtRCT4T+xMPqrytnjwC2yU6CQ73l\nrBCw2xtfNu1xaCp2KInvcnSGXgbul1iyEHiaSuolfFKC3fnxsfpIMc3HS2so8GSH\np60pCv2UZwKBgAfEy6vipwRBXt0dWpl9wyfXNWpz+HzT6IZ1cUlw/7vDXmAl1tEP\nvCd7RVAqD95Ze+OqU5HhorXi57/Rqzws1368TeVpnHQS9tQbbFAf1bJ0KKHqSZG4\n1RLSe4yBIBKdnwUB8aMXxDSbi5vBlokSlcZZZdUGR+BgevAlSURLAWOtAoGBAK45\ntH/pugTDFoNadG6a67sjwILFWcBV70dn+ysgQk1CL3rfL4V2QUYqqg2P+E+jDxBj\n64tU+2+KJy8xpeh0N7+H1mLgQGz8TrzfOpWlMD3ZN4/cvGjDX/PuOFHj3khtPYji\nPoe6koB+/LUfoqFFkP9k+r7dqsyGAH3dibxqc2bFAoGAHZmCD0iP+srTs/FOAlEH\n9HCRQPI3GIM76KZURb800uzgYEoOTObi5Uk5FM2Mz1/fq8GgKgVCZPOnYGcLn6V5\nM3CUEFMA17t9/0z3yqJXWytrY0FAM2Xsx0BdOCAjSr0Vcpc0B+i0NfycJPLDVMrk\nkN5bAOERx4VTjupjtx1DHX4=\n-----END PRIVATE KEY-----\n",
        }),
    });
}
export var adminAuth = admin.auth();
