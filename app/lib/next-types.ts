export type SearchParamValue = string | string[] | undefined

export type PageSearchParams<
    T extends Record<string, SearchParamValue> = Record<string, SearchParamValue>,
> = Promise<T>

export type RouteParams<T extends Record<string, string>> = Promise<T>
