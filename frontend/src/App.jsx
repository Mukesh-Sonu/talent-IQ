import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import "./App.css";

function App() {
  console.log(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
  return (
    <>
      <h1>Hello</h1>
      <Show when="signed-out">
        <SignInButton mode="modal" />
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </>
  );
}

export default App;
