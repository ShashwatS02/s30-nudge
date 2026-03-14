type Props = {
  message: string;
};

export default function Toast({ message }: Props) {
  return (
    <div
      className="fade-in"
      style={{
        position: "sticky",
        top: 16,
        zIndex: 20,
        marginBottom: 16,
        display: "flex",
        justifyContent: "center"
      }}
    >
      <div
        style={{
          background: "#111827",
          color: "#ffffff",
          padding: "10px 14px",
          borderRadius: 999,
          boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
          fontSize: 14,
          fontWeight: 600
        }}
      >
        {message}
      </div>
    </div>
  );
}
