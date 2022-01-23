import { EditorView, Schema } from "@bangle.dev/pm";
import autocomplete, { ActionKind, closeAutocomplete, FromTo, Options } from "prosemirror-autocomplete";
import dropdownGroups from "./dropdown.json";
import { DropdownGroup } from "./types";

const picker = {
  view: null as EditorView | null,
  open: false,
  current: 0,
  range: null as FromTo | null,
};

const totalDropdownItems = dropdownGroups.reduce((current, dropdownGroup) => current + dropdownGroup.items.length, 0);
const dropdownItems: HTMLDivElement[] = [];

function placeSuggestion() {
  const suggestion = document.querySelector('#suggestion') as HTMLDivElement;
  suggestion.style.display = picker.open ? 'block' : 'none';
  const rect = document.getElementsByClassName('autocomplete')[0]?.getBoundingClientRect();

  if (!rect) return;
  suggestion.style.top = `${rect.top + rect.height}px`;
  suggestion.style.left = `${rect.left}px`;

  dropdownItems.forEach((dropdownItem, dropdownItemIndex) => {
    dropdownItem.classList[dropdownItemIndex === picker.current ? 'add' : 'remove']('selected')
  });
}

const options: Options = {
  reducer: (action) => {
    picker.view = action.view;
    switch (action.kind) {
      case ActionKind.open:
        picker.current = 0;
        picker.open = true;
        picker.range = action.range;
        placeSuggestion();
        return true;
      case ActionKind.close:
        picker.open = false;
        placeSuggestion();
        return true;
      case ActionKind.up:
        picker.current -= 1;
        picker.current += totalDropdownItems;
        picker.current %= totalDropdownItems;
        placeSuggestion();
        return true;
      case ActionKind.down:
        picker.current += 1;
        picker.current %= totalDropdownItems;
        placeSuggestion();
        return true;
      case ActionKind.enter: {
        const selectedDropdownItem = dropdownItems.find(dropdownItem => dropdownItem.classList.contains("selected"));
        const schema = (action.view.state.schema as Schema);
        let fragment = schema.nodes.paragraph.create();
        if (selectedDropdownItem) {
          const selectedDropdownItemLabel = selectedDropdownItem.querySelector(".suggestion-group-item-label")!.textContent;
          switch (selectedDropdownItemLabel) {
            case "Heading 1": {
              fragment = schema.nodes.heading.create({
                level: 1
              })
              break;
            }
            case "Heading 2": {
              fragment = schema.nodes.heading.create({
                level: 2
              })
              break;
            }
            case "Heading 3": {
              fragment = schema.nodes.heading.create({
                level: 3
              })
              break;
            }
          }
        }
        const tr = action.view.state.tr
          .deleteRange(action.range.from, action.range.to)
          .insert(action.range.from, fragment);
        action.view.dispatch(tr);
        return true;
      }
      default:
        return false;
    }
  },
  triggers: [
    { name: 'command', trigger: '/', decorationAttrs: { class: 'command' } },
  ],
};

export const autocompletePlugin = autocomplete(options);

function dropdownItemClickHandler() {
  if (!picker.view) return;
  closeAutocomplete(picker.view);
  picker.open = false;
  placeSuggestion();
  if (!picker.range) return;
  const tr = picker.view.state.tr
    .deleteRange(picker.range.from, picker.range.to)
    .insert(picker.range.from, picker.view.state.schema.nodes.paragraph.create("Hello World", null, null));
  picker.view.dispatch(tr);
  picker.view.focus();
}

export const DropdownComponent = <div id="suggestion" style={{ display: "none" }}>
  {(dropdownGroups as DropdownGroup[]).map(dropdownGroup => <div className="suggestion-group" key={dropdownGroup.group}>
    <div className="suggestion-group-name">{dropdownGroup.group}</div>
    <div className="suggestion-group-items">
      {dropdownGroup.items.map(item => {
        const dropdownItemComponent = <div ref={(element) => {
          if (element) {
            dropdownItems.push(element);
          }
        }} key={`${dropdownGroup.group}.${item.label}`} onClick={dropdownItemClickHandler} className="suggestion-group-item">
          <span className="suggestion-group-item-icon">{item.icon}</span>
          <span className="suggestion-group-item-label">{item.label}</span>
        </div>;
        return dropdownItemComponent;
      })}
    </div>
  </div>)}
</div>