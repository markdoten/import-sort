import {resolve} from "path";

import {CLIEngine} from "eslint";
import {IStyleAPI, IStyleItem} from "import-sort-style";
import * as _ from "lodash";

export default function(styleApi: IStyleAPI, file?: string): IStyleItem[] {
  const {
    member,
    alias,

    hasNoMember,
    hasOnlyNamespaceMember,
    hasMultipleMembers,
    hasSingleMember,

    unicode,
  } = styleApi;

  let useLowerCase = false;
  let memberSortSyntaxOrder = ["none", "all", "multiple", "single"];

  if (file) {
    try {
      const eslintCLI = new CLIEngine({});
      const eslintConfig = eslintCLI.getConfigForFile(resolve(file));

      useLowerCase = _.get(
        eslintConfig,
        "rules.sort-imports[1].ignoreCase",
        false,
      );

      const newMemberSortSyntaxOrder: string[] = _.get(
        eslintConfig,
        "rules.sort-imports[1].memberSyntaxSortOrder",
        [],
      );

      if (
        _.difference(memberSortSyntaxOrder, newMemberSortSyntaxOrder).length ===
        0
      ) {
        memberSortSyntaxOrder = newMemberSortSyntaxOrder;
      }
    } catch (e) {
      // Just use defaults in this case
    }
  }

  const eslintSort = (first, second) => {
    if (useLowerCase) {
      return unicode(first.toLowerCase(), second.toLowerCase());
    }

    return unicode(first, second);
  };

  const styleItemByType = {
    none: {match: hasNoMember},
    all: {match: hasOnlyNamespaceMember, sort: member(eslintSort)},
    multiple: {
      match: hasMultipleMembers,
      sort: member(eslintSort),
      sortNamedMembers: alias(eslintSort),
    },
    single: {match: hasSingleMember, sort: member(eslintSort)},
  };

  return [
    // none (don't sort them, because side-effects may need a particular ordering)
    styleItemByType[memberSortSyntaxOrder[0]],

    // all
    styleItemByType[memberSortSyntaxOrder[1]],

    // multiple
    styleItemByType[memberSortSyntaxOrder[2]],

    // single
    styleItemByType[memberSortSyntaxOrder[3]],
  ];
}
