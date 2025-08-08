import { auth, db } from "./firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export async function emailPasswordSignIn(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function emailPasswordSignUp(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export type ReservationPayload = {
  serviceId: string;
  dateISO: string; // YYYY-MM-DD
  time: string; // HH:mm
  people: number;
  boardType: string;
  extras: string[];
  totalTRY: number;
  customer: { name: string; email: string; phone: string };
  coupon?: string;
  termsAccepted: boolean;
  userUid?: string | null;
};

export async function createReservation(payload: ReservationPayload) {
  const ref = await addDoc(collection(db, "reservations"), {
    ...payload,
    createdAt: serverTimestamp(),
    status: "pending-payment",
  });
  return ref.id;
}
