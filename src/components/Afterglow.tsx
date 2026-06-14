interface Props {
  show: boolean;
  message: string;
  sub: string;
  onClose: () => void;
}

export default function Afterglow({ show, message, sub, onClose }: Props) {
  return (
    <div className={`afterglow${show ? ' show' : ''}`} onClick={onClose}>
      <div className="ring" />
      <p className="msg">{message}</p>
      <p className="sub">{sub}</p>
      <p className="tap">화면을 누르면 닫혀요</p>
    </div>
  );
}
