import ChatInbox from "@/components/admin/ChatInbox";

export const metadata = { title: "Support Chat · Admin · MayCSS" };

export default function AdminChatPage() {
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Support Chat</h1>
          <p>
            Live conversations with your customers. The inbox auto-refreshes
            every 3 seconds; replies land in the customer&apos;s widget within
            the same window.
          </p>
        </div>
      </header>
      <ChatInbox />
    </section>
  );
}
