import { renderToStaticMarkup } from 'react-dom/server';
import { SignOutButton, ClerkProvider } from "@clerk/nextjs";

console.log(renderToStaticMarkup(
  <ClerkProvider publishableKey="pk_test_b3Blbi1zd2lmdC01OTQyLmNsZXJrLmFjY291bnRzLmRldiQ=">
    <SignOutButton>hello</SignOutButton>
  </ClerkProvider>
));
