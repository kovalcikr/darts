'use server'

import axios from "axios";

export default async function getTournamentInfo(tournametId : string) {
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
      const tournament = await axios.get("https://api.cuescore.com/tournament/?id=" + tournametId, {
        headers: {
            Cookie: res.headers.getSetCookie(),
            cache: 'no-store'
        }
      });
      return tournament.data;
}