import { signIn } from "./actions";
import { CyclingName } from "./client";
import { FeaturePreview } from "./customize/parts";
import { today } from "@/lib/today";

// The page signed-out visitors see.
export function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <div>
          <h1>Your own newspaper, every morning.</h1>
          <p>
            Choose the topics, places and puzzles you care about. An editor writes and lays out a fresh paper for you
            each day, ready to read or print.
          </p>
          <SignIn />
        </div>
        <MiniFrontPage />
      </section>

      <section>
        <h2>How it works</h2>
        <ol className="steps">
          <li>
            <b>Build your paper.</b> Drag sections onto the pages: news topics, your city, weather, crossword, sudoku.
          </li>
          <li>
            <b>Sleep.</b> Early each morning, an AI editor reads the news and writes your edition, with sources for
            every story.
          </li>
          <li>
            <b>Read it on paper.</b> Open the PDF, or print it at home.
          </li>
        </ol>
      </section>

      <section className="printer">
        <h2>
          The printer box <span className="soon">Coming soon</span>
        </h2>
        <p>
          A tiny Raspberry Pi next to your printer fetches the paper while you sleep. It&apos;s waiting in the tray when
          you wake up. No screens before breakfast.
        </p>
      </section>

      <SignIn />
    </div>
  );
}

function SignIn() {
  return (
    <form action={signIn}>
      <button className="button">Sign in with Google</button>
    </form>
  );
}

// A sketch of a front page, to show what a paper looks like.
function MiniFrontPage() {
  return (
    <div className="mini-paper" aria-hidden>
      <div className="mini-masthead">
        <CyclingName />
      </div>
      <div className="mini-meta">
        <span>{today().date}</span>
      </div>
      <FeaturePreview kind="weather" />
      <h3>Good morning. Here&apos;s what happened while you slept.</h3>
      <div className="mini-columns">
        <span />
        <span />
        <span />
      </div>
      <div className="mini-bottom">
        <div>
          <b>Sudoku</b>
          <FeaturePreview kind="sudoku" />
        </div>
        <div>
          <b>Word of the Day</b>
          <FeaturePreview kind="wordOfTheDay" />
          <span className="mini-lines" />
        </div>
      </div>
    </div>
  );
}
