const Title = ({ text }: { text: string }) => {
  return (
    <h2 className=" text-md sm:text-lg font-semibold border-b pb-2 border-black/10">{text}</h2>
  );
};

export default Title;
