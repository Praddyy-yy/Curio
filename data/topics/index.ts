import type { InsertTopic } from "@/lib/supabase/types";

import { aiTopics } from "./ai.ts";
import { computerScienceTopics } from "./computer-science.ts";
import { economicsTopics } from "./economics.ts";
import { historyTopics } from "./history.ts";
import { philosophyTopics } from "./philosophy.ts";
import { psychologyTopics } from "./psychology.ts";
import { scienceTopics } from "./science.ts";

export const allTopics: InsertTopic[] = [
  ...aiTopics,
  ...computerScienceTopics,
  ...economicsTopics,
  ...historyTopics,
  ...philosophyTopics,
  ...psychologyTopics,
  ...scienceTopics,
];
