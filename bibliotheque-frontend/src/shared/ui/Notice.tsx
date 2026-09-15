interface Props {
  text: string;
}

export default function Notice({ text }: Props) {
  if (!text) return null;
  return <p className="error">{text}</p>;
}
