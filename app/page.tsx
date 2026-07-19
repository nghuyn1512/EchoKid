import GoogleLoginButton from "@/components/login";
import { global } from "styled-jsx/css";
export default function Home() {
  return (
    <div>
      <h1>Chào mừng phụ huynh đến với trang chủ EchoKid</h1>
      <GoogleLoginButton/>
    </div>
  );
}
