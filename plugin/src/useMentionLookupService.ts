import { useEffect, useMemo, useState } from "react";
import { BeautifulMentionsItem } from "./BeautifulMentionsPluginProps";
import { useDebounce } from "./useDebounce";

interface MentionsLookupServiceOptions {
  queryString: string | null;
  trigger: string | null;
  searchDelay?: number;
  items?: Record<string, BeautifulMentionsItem[]>;
  onSearch?: (
    trigger: string,
    queryString?: string | null,
  ) => Promise<BeautifulMentionsItem[]>;
  justSelectedAnOption?: React.MutableRefObject<boolean>;
}

export function useMentionLookupService(options: MentionsLookupServiceOptions) {
  const { queryString, trigger, searchDelay, items, onSearch, justSelectedAnOption } = options;
  const debouncedQueryString = useDebounce(queryString, searchDelay);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<BeautifulMentionsItem>>([]);
  const [query, setQuery] = useState<string | null>(null);

  useEffect(() => {
    if (trigger === null || debouncedQueryString === null) {
      setResults([]);
      setQuery(null);
      return;
    }
    if (items) {
      const mentions =
        items &&
        Object.entries(items).find(([key]) => {
          return new RegExp(key).test(trigger);
        });
      if (!mentions) {
        return;
      }
      const result = !debouncedQueryString
        ? [...mentions[1]]
        : mentions[1].filter((item) => {
            const value = typeof item === "string" ? item : item.value;
            return value
              .toLowerCase()
              .includes(debouncedQueryString.toLowerCase());
          });
      setResults(result);
      setQuery(debouncedQueryString);
      return;
    }
    if (onSearch) {
      setLoading(true);
      setQuery(debouncedQueryString);
      onSearch(trigger, justSelectedAnOption?.current ? '' : debouncedQueryString)
        .then(setResults)
        .finally(() => setLoading(false));

      if (justSelectedAnOption?.current) {
        justSelectedAnOption.current = false;
      }

      return;
    }
  }, [debouncedQueryString, items, onSearch, trigger, justSelectedAnOption]);

  return useMemo(
    () => ({ loading, results, query }),
    [loading, results, query],
  );
}
