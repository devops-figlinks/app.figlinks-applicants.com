import { Backdrop } from "@mui/material";

const Loading = ({
  loading,
  label = "Loading...",
}: {
  loading: Boolean;
  label?: string;
}) => {
  return (
    <Backdrop
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "rgba(256,256,256,0.8)",
        flexDirection: "column",
      }}
      open={Boolean(loading)}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <object
          type="image/svg+xml"
          data={"/interviews/loading.svg"}
          width={100}
          height={100}
        />
        <p
          style={{
            whiteSpace: "pre-wrap",
            fontSize: "1.2rem",
            textAlign: "center",
          }}
        >
          {label}
        </p>
      </div>
    </Backdrop>
  );
};
export default Loading;
