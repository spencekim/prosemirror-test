import { InputRule, inputRules } from 'prosemirror-inputrules';
import { schema } from '../schema';

const startBulletedList = (regexp: RegExp) =>
    new InputRule(regexp, (state, match, start, end) => {
        const paragraph = schema.nodes.paragraph.create();
        const listItem = schema.nodes.listItem.create(undefined, paragraph);
        const bulletList = schema.nodes.bulletList.create(undefined, listItem);
        const tr = state.tr.replaceRangeWith(start, end, bulletList);
        return tr;
    });

const ListPlugin = inputRules({
    rules: [startBulletedList(new RegExp('^-[^S\\n]', 'gi'))] // for some reason, simply using '^- ' does not work
});

export { ListPlugin };
