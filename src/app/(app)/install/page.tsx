import { InstallAppButton } from "@/components/install-app-button";
import { PageHeader } from "@/components/page-header";

export default function InstallPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Install Paine Pointe" />

      <section className="card overflow-hidden">
        <div className="bg-deep p-5 text-white sm:p-7">
          <p className="section-label !text-white/60">Your lakehouse app</p>
          <h2 className="mt-1 font-display text-2xl sm:text-3xl">
            Put Paine Pointe on your home screen
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            It opens like an app, stays easy to find, and always uses the same
            family information as the website.
          </p>
          <div className="mt-4">
            <InstallAppButton />
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <div className="rounded-lh bg-mist p-4">
            <p className="section-label">iPhone or iPad</p>
            <ol className="mt-3 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-3">
                <span className="font-display text-xl text-water">1</span>
                Open Paine Pointe in Safari.
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl text-water">2</span>
                Tap the Share button at the bottom of the screen.
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl text-water">3</span>
                Choose Add to Home Screen, then tap Add.
              </li>
            </ol>
          </div>

          <div className="rounded-lh bg-mist p-4">
            <p className="section-label">Android phone</p>
            <ol className="mt-3 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-3">
                <span className="font-display text-xl text-water">1</span>
                Open Paine Pointe in Chrome.
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl text-water">2</span>
                Tap the three-dot menu in the upper-right corner.
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl text-water">3</span>
                Choose Install app or Add to Home screen.
              </li>
            </ol>
          </div>
        </div>

        <p className="border-t border-sand-line px-5 py-4 text-xs text-ink-faint sm:px-7">
          On a computer, Chrome or Edge may also show an install icon at the
          right side of the address bar.
        </p>
      </section>
    </div>
  );
}
