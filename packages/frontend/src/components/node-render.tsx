import classNames from "classnames"
interface IconProps extends React.SVGAttributes<SVGElement> {
  children?: React.ReactNode;
  size?: string | number;
  color?: string;
  title?: string;
}

interface Props extends React.HTMLAttributes<HTMLDivElement> { 
  icon: (props: IconProps) => JSX.Element
  title: string
  isPreview?: boolean
}

const NodeRender = ({ icon, title, isPreview=false, style, ...children }: Props) => {
  const Icon = icon
  return (
    <div 
      style={style} 
      className={classNames("p-4 flex w-24 min-h-8 justify-center content-center border rounded bg-white shadow", { "opacity-25": isPreview })}
      {...children}>
      <div className="flex flex-col items-center">
        {<Icon className="mx-auto" />}
        <p className="text-center break-all w-full leading-[0.8] text-xs mt-1">{title}</p>
      </div>
    </div>
  )
}

export default NodeRender