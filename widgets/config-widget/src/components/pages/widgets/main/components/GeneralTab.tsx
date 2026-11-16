import { Separator } from '@/components/common/Separator';
import { useState } from 'react';
import { NumberInput } from '@/components/NumberInput';
import { useWidgetSetting } from '@overline-zebar/config';
import type { MainWidgetSettings } from '@overline-zebar/config';
import {
  FieldDescription,
  FieldInput,
  FieldTitle,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Button, // Added Button import
} from '@overline-zebar/ui';

const powerButtonPositionOptions: {
  label: string;
  value: MainWidgetSettings['powerButtonPosition'];
}[] = [
  { label: 'Right end', value: 'right' },
  { label: 'Left end', value: 'left' },
  { label: 'Hidden', value: 'hidden' },
];

function GeneralTab() {
  const [mediaMaxWidth, setMediaMaxWidth] = useWidgetSetting(
    'main',
    'mediaMaxWidth'
  );
  const [marginX, setMarginX] = useWidgetSetting('main', 'marginX');
  const [paddingLeft, setPaddingLeft] = useWidgetSetting('main', 'paddingLeft');
  const [paddingRight, setPaddingRight] = useWidgetSetting(
    'main',
    'paddingRight'
  );
  const [isPaddingLinked, setIsPaddingLinked] = useState(
    paddingLeft === paddingRight
  );
  const [dynamicWorkspaceIndicator, setDynamicWorkspaceIndicator] =
    useWidgetSetting('main', 'dynamicWorkspaceIndicator');
  const [powerButtonPosition, setPowerButtonPosition] = useWidgetSetting(
    'main',
    'powerButtonPosition'
  );

  const handleLinkedPaddingChange = (value: number) => {
    setPaddingLeft(value);
    setPaddingRight(value);
  };

  return (
    <>
      <FormField switch>
        <FieldTitle>Allow Dynamic Workspace Indicators</FieldTitle>
        <FieldInput>
          <Switch
            checked={dynamicWorkspaceIndicator}
            onCheckedChange={setDynamicWorkspaceIndicator}
          />
        </FieldInput>
        <FieldDescription>
          Allow workspace indicators to be named after the first opened window.
        </FieldDescription>
      </FormField>
      <Separator />
      <FormField>
        <FieldTitle>Horizontal Margin</FieldTitle>
        <FieldInput>
          <NumberInput value={marginX} onChange={setMarginX} min={0} />
        </FieldInput>
        <FieldDescription>
          Sets the outside space (left and right). Good for a
          &quot;floating&quot; appearance.
        </FieldDescription>
      </FormField>
      <Separator />
      <FormField>
        <FieldTitle>Horizontal Padding</FieldTitle>
        <FieldInput className="flex items-center gap-3">
          {isPaddingLinked ? (
            <NumberInput
              value={paddingLeft}
              onChange={handleLinkedPaddingChange}
              min={0}
              className="flex-grow"
            />
          ) : (
            <>
              <NumberInput
                value={paddingLeft}
                onChange={setPaddingLeft}
                min={0}
                className="flex-grow"
              />
              <NumberInput
                value={paddingRight}
                onChange={setPaddingRight}
                min={0}
                className="flex-grow"
              />
            </>
          )}
          <Button onClick={() => setIsPaddingLinked(!isPaddingLinked)}>
            {isPaddingLinked ? 'Unlink' : 'Link'}
          </Button>
        </FieldInput>
        <FieldDescription>
          Sets the inner space (left and right).
        </FieldDescription>
      </FormField>
      <Separator />
      <FormField>
        <FieldTitle>Media Max Width (px)</FieldTitle>
        <FieldInput>
          <Input
            placeholder="e.g., 400"
            value={mediaMaxWidth}
            onChange={(e) => setMediaMaxWidth(e.target.value)}
            type="number"
          />
        </FieldInput>
        <FieldDescription>
          Set the maximum width for media displayed in the topbar widget.
        </FieldDescription>
      </FormField>
      <Separator />
      <FormField>
        <FieldTitle>Power Button Position</FieldTitle>
        <FieldInput>
          <Select
            onValueChange={(value) =>
              setPowerButtonPosition(
                value as MainWidgetSettings['powerButtonPosition']
              )
            }
            defaultValue={powerButtonPosition}
            items={powerButtonPositionOptions}
          >
            <SelectTrigger>
              <SelectValue>
                {(value: string) =>
                  powerButtonPositionOptions.find((opt) => opt.value === value)
                    ?.label ?? ''
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {powerButtonPositionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldInput>
        <FieldDescription>
          Where the power button sits in the topbar. Move it away from the right
          end so closing windows in a hurry cannot hit it.
        </FieldDescription>
      </FormField>
    </>
  );
}

export default GeneralTab;
