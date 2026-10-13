// Sign out control (Requirement 42.7, 44.10). A plain <form> posting to the
// signOut Server Action, so it works without client JavaScript.
import { signOut } from "@/app/admin/actions";
import s from "./AdminShell.module.css";

export default function SignOutButton() {
  return (
    <form action={signOut} className={s.signOutForm}>
      <button type="submit" className={s.signOut}>
        Sign out
      </button>
    </form>
  );
}
