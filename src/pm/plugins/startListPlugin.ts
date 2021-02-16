import { InputRule, inputRules } from 'prosemirror-inputrules';
import { schema } from '../schema';

export function createList(regexp: RegExp) {
    return new InputRule(regexp, (state, _, start, end) => {
        const paragraph = schema.nodes.paragraph.create();
        const listItem = schema.nodes.listItem.create(undefined, paragraph);
        const bulletList = schema.nodes.bulletList.create(undefined, listItem);
        const tr = state.tr.delete(start, end);
        tr.insert(start, bulletList);
        return tr;
    });
}

const ListPlugin = inputRules({
    rules: [createList(/- /g)]
});

export { ListPlugin };
