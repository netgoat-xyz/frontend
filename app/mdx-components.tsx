import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => <h1 className="text-4xl font-bold mb-4">{children}</h1>,
    p: ({ children }) => <p className="mb-4 leading-7">{children}</p>,
    ...components,
  }
}