import axios from "axios";

export async function GET(request: Request, {params} : {params: {id : string}}) {
  const res = await fetch("https://cuescore.com/ajax/user/login.php", {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: 'POST',
    body: new URLSearchParams({
      postUrl: "/ajax/user/login.php",
      domPath: ".User+.login+>+form",
      redirect: "",
      callback: "",
      hideOnOK: "true",
      useSpinner: "true",
      cover: "",
      username: process.env.CUESCORE_USERNAME as string,
      password: process.env.CUESCORE_PASSWORD as string,
      remember: "on",
    }),
  });
  const tournament = await axios.get("https://api.cuescore.com/tournament/?id=" + params.id, {
    headers: {
        Cookie: res.headers.getSetCookie()
    }
  });
  return  Response.json( tournament.data );
}
