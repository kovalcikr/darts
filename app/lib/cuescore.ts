'use server'

import axios from "axios";
import { revalidatePath } from "next/cache";

export default async function getTournamentInfo(tournamentId : string) {
    const cookie = await auth();
    const tournament = await axios.get("https://api.cuescore.com/tournament/?id=" + tournamentId, {
      headers: {
          Cookie: cookie,
          cache: 'no-store'
      }
    });
    return tournament.data;
}

export async function setScore(tournamentId, matchId, playerALegs, playerBlegs) {
  const cookie = await auth();
  const url = `https://cuescore.com/ajax/tournament/match.php?tournamentId=${tournamentId}&matchId=${matchId}&scoreA=${playerALegs}&scoreB=${playerBlegs}&matchstatus=1`;
  console.log(url);
  const res = await axios.get(url, {
    headers: {
        Cookie: cookie,
    }
  });
  if (res.data != "OK") {
    throw new Error('Cannot update score');
  }
}

export async function finishMatch(tournamentId, matchId, playerALegs, playerBlegs) {
  const cookie = await auth();
  const url = `https://cuescore.com/ajax/tournament/match.php?tournamentId=${tournamentId}&matchId=${matchId}&scoreA=${playerALegs}&scoreB=${playerBlegs}&matchstatus=2`;
  console.log(url)
  const res = await axios.get(url, {
    headers: {
        Cookie: cookie,
    }
  });
  if (res.data != "OK") {
    throw new Error('Cannot finish match');
  }
  revalidatePath('/tournaments/[id/]tables/[table]', 'page');
}

async function auth() {
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
    return res.headers.getSetCookie()
}