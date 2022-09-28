
export type BaseApiColor = 'gray' | 'turquoise' | 'orange' | 'yellow' | 'teal' | 'blue' | 'purple' | 'pink' | 'red';
export type ApiColor = 'default' & BaseApiColor & `${BaseApiColor}_background`;

export interface FailedImportsError {
  pageId: string;
  type: 'page' | 'database';
  title: string;
  blocks: [string, number][][];
}

export type NotionImage = {
  type: 'external';
  external: {
    url: string;
  };
} | {
  type: 'file';
  file: {
    url: string;
    expiry_time: string;
  };
};

export type RichTextItemResponse = ({
  type: 'text';
  text: {
    content: string;
    link: {
      url: string;
    } | null;
  };
} | {
  type: 'mention';
  mention: {
    type: 'page';
    page: {
      id: string;
    };
  };
} | {
  type: 'mention';
  mention: {
    type: 'database';
    database: {
      id: string;
    };
  };
}) & {
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
    color: ApiColor;
  };
  plain_text: string;
  href: string | null;
};

export type GetDatabaseResponse = {
  title: RichTextItemResponse[];
  icon: {
    type: 'emoji';
    emoji: string;
  } | null | {
    type: 'external';
    external: {
      url: string;
    };
  } | null | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
  } | null;
  cover: {
    type: 'external';
    external: {
      url: string;
    };
  } | null | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
  } | null;
  properties: Record<string, {
    type: 'number';
    number: {
      format: string;
    };
    id: string;
    name: string;
  } | {
    type: 'formula';
    formula: {
      expression: string;
    };
    id: string;
    name: string;
  } | {
    type: 'select';
    select: {
      options: {
        name: string;
        id?: string;
        color?: string;
      }[];
    };
    id: string;
    name: string;
  } | {
    type: 'multi_select';
    multi_select: {
      options: {
        name: string;
        id?: string;
        color?: string;
      }[];
    };
    id: string;
    name: string;
  } | {
    type: 'relation';
    relation: {
      database_id: string;
      synced_property_id: string;
      synced_property_name: string;
    };
    id: string;
    name: string;
  } | {
    type: 'rollup';
    rollup: {
      rollup_property_name: string;
      relation_property_name: string;
      rollup_property_id: string;
      relation_property_id: string;
      function: string;
    };
    id: string;
    name: string;
  } | {
    type: 'title';
    title: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'rich_text';
    rich_text: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'url';
    url: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'people';
    people: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'files';
    files: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'email';
    email: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'phone_number';
    phone_number: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'date';
    date: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'checkbox';
    checkbox: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'created_by';
    created_by: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'created_time';
    created_time: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'last_edited_by';
    last_edited_by: Record<string, never>;
    id: string;
    name: string;
  } | {
    type: 'last_edited_time';
    last_edited_time: Record<string, never>;
    id: string;
    name: string;
  }>;
  parent: {
    type: 'page_id';
    page_id: string;
  } | {
    type: 'workspace';
    workspace: true;
  };
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_by: {
    id: string;
    object: 'user';
  };
  id: string;
  object: 'database';
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  url: string;
};

export type GetPageResponse = {
  parent: {
    type: 'database_id';
    database_id: string;
  } | {
    type: 'page_id';
    page_id: string;
  } | {
    type: 'workspace';
    workspace: true;
  };
  properties: Record<string, {
    type: 'title';
    title: RichTextItemResponse[];
    id: string;
  } | {
    type: 'rich_text';
    rich_text: RichTextItemResponse[];
    id: string;
  }
  >;
  icon: {
    type: 'emoji';
    emoji: string;
  } | null | {
    type: 'external';
    external: {
      url: string;
    };
  } | null | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
  } | null;
  cover: {
    type: 'external';
    external: {
      url: string;
    };
  } | null | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
  } | null;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_by: {
    id: string;
    object: 'user';
  };
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  url: string;
}

export type BlockObjectResponse = {
  type: 'paragraph';
  paragraph: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'heading_1';
  heading_1: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'heading_2';
  heading_2: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'heading_3';
  heading_3: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'bulleted_list_item';
  bulleted_list_item: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'numbered_list_item';
  numbered_list_item: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'quote';
  quote: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'to_do';
  to_do: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
    checked: boolean;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'toggle';
  toggle: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'template';
  template: {
    rich_text: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'synced_block';
  synced_block: {
    synced_from: {
      type: 'block_id';
      block_id: string;
    } | null;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'child_page';
  child_page: {
    title: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'child_database';
  child_database: {
    title: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'equation';
  equation: {
    expression: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'code';
  code: {
    rich_text: RichTextItemResponse[];
    caption: RichTextItemResponse[];
    language: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'callout';
  callout: {
    rich_text: RichTextItemResponse[];
    color: ApiColor;
    icon: {
      type: 'emoji';
      emoji: string;
    } | null | {
      type: 'external';
      external: {
        url: string;
      };
    } | null | {
      type: 'file';
      file: {
        url: string;
        expiry_time: string;
      };
    } | null;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'divider';
  divider: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'breadcrumb';
  breadcrumb: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'table_of_contents';
  table_of_contents: {
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'column_list';
  column_list: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'column';
  column: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'link_to_page';
  link_to_page: {
    type: 'page_id';
    page_id: string;
  } | {
    type: 'database_id';
    database_id: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'table';
  table: {
    has_column_header: boolean;
    has_row_header: boolean;
    table_width: number;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'table_row';
  table_row: {
    cells: RichTextItemResponse[][];
    color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'embed';
  embed: {
    url: string;
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'bookmark';
  bookmark: {
    url: string;
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'image';
  image: {
    type: 'external';
    external: {
      url: string;
    };
    caption: RichTextItemResponse[];
  } | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'video';
  video: {
    type: 'external';
    external: {
      url: string;
    };
    caption: RichTextItemResponse[];
  } | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'pdf';
  pdf: {
    type: 'external';
    external: {
      url: string;
    };
    caption: RichTextItemResponse[];
  } | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'file';
  file: {
    type: 'external';
    external: {
      url: string;
    };
    caption: RichTextItemResponse[];
  } | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'audio';
  audio: {
    type: 'external';
    external: {
      url: string;
    };
    caption: RichTextItemResponse[];
  } | {
    type: 'file';
    file: {
      url: string;
      expiry_time: string;
    };
    caption: RichTextItemResponse[];
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'link_preview';
  link_preview: {
    url: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'unsupported';
  unsupported: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
    id: string;
    object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    object: 'user';
  };
  has_children: boolean;
  archived: boolean;
};
