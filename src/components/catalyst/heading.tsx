import clsx from 'clsx'

type HeadingProps = { level?: 1 | 2 | 3 | 4 | 5 | 6 } & React.ComponentPropsWithoutRef<
 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
>

export function Heading({ className, level = 1, ...props }: HeadingProps) {
 let Element: `h${typeof level}` = `h${level}`

 return (
 <Element
 {...props}
 className={clsx(className, 'text-2xl leading-8 font-semibold text-zinc-950 sm:text-xl sm:leading-8 dark:text-white')}
 />
 )
}

export function Subheading({ className, level = 2, ...props }: HeadingProps) {
 let Element: `h${typeof level}` = `h${level}`

 return (
 <Element
 {...props}
 className={clsx(className, 'text-base leading-7 font-semibold text-zinc-950 sm:text-sm sm:leading-6 dark:text-white')}
 />
 )
}
