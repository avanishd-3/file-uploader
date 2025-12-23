import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"

export function LoadingSpinnerWithMessage({message, spinnerSize}: {message: string, spinnerSize?: "sm" | "md" | "lg" | "xl"}) {


  // Map size prop to Spinner size
  const sizeMap: Record<string, string> = {
    sm: "size-3",
    md: "size-4",
    lg: "size-6",
    xl: "size-8",
  };
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
      <Item variant="muted">
        <ItemMedia>
          {/* See: https://ui.shadcn.com/docs/components/spinner#size */}
          <Spinner className={spinnerSize ? sizeMap[spinnerSize] : sizeMap.md} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">{message}</ItemTitle>
        </ItemContent>
      </Item>
    </div>
  )
}
