"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useId, useMemo, useState } from "react";
import { AddButton, FormFrame, RemoveButton } from "./DecisionFormControls";
import {
  blankQuestion,
  freeName,
  readForm,
  removeAt,
  renameKey,
  replaceAt,
  retype,
  withNoulCriterion,
  withoutKey,
  type ChoiceQuestion,
  type FormPayload,
  type FormQuestion,
  type NoulQuestion,
  type QuestionType,
  type ScoreQuestion,
} from "./lib/formPayload";
import type { SystemOnePayloadValidation } from "./lib/validatePayload";

const QUESTION_TYPES: readonly QuestionType[] = ["choice", "noul", "score"];

const isQuestionType = (value: unknown): value is QuestionType => QUESTION_TYPES.some((type) => type === value);

interface SystemOneFormProps {
  value: string;
  onChange: (value: string) => void;
  validation: SystemOnePayloadValidation;
  onReset: () => void;
}

interface QuestionEditorProps<Q extends FormQuestion> {
  question: Q;
  onChange: (question: FormQuestion) => void;
}

interface KeyInputProps {
  value: string;
  taken: readonly string[];
  onCommit: (value: string) => void;
  label: string;
  placeholder?: string;
}

function keyError(next: string, current: string, taken: readonly string[], t: (key: string, opts?: Record<string, unknown>) => string): string | undefined {
  if (next === "") {
    return t("playground.systemOne.enterAName", { defaultValue: "Enter a name" });
  }
  if (next !== current && taken.includes(next)) {
    return t("playground.systemOne.alreadyUsed", { name: next, defaultValue: `"${next}" is already used` });
  }
  return undefined;
}

function KeyInput({ value, taken, onCommit, label, placeholder }: KeyInputProps) {
  const { t } = useTranslation();
  const errorId = useId();
  const [draft, setDraft] = useState(value);
  const next = draft.trim();
  const error = keyError(next, value, taken, t);

  function commit() {
    if (error === undefined && next !== value) {
      onCommit(next);
      return;
    }
    setDraft(value);
  }

  return (
    <div className="grid min-w-0 flex-1 gap-1">
      <Input
        aria-label={label}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
      />
      {error !== undefined && (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function ChoiceOptions({ question, onChange }: QuestionEditorProps<ChoiceQuestion>) {
  const { t } = useTranslation();
  const labels = Object.keys(question.criteria);
  const writeCriteria = (criteria: Record<string, string>) => onChange({ ...question, criteria });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{t("playground.systemOne.options", { defaultValue: "Options" })}</span>
      {Object.entries(question.criteria).map(([label, description], index) => (
        <div key={index} className="flex items-start gap-2">
          <KeyInput
            key={label}
            label={t("playground.systemOne.optionLabel", { defaultValue: "Option label" })}
            value={label}
            taken={labels}
            onCommit={(next) => writeCriteria(renameKey(question.criteria, label, next))}
          />
          <Input
            aria-label={t("playground.systemOne.optionDescriptionAria", { label, defaultValue: `Description of ${label}` })}
            className="flex-2"
            value={description}
            placeholder={t("playground.systemOne.optionalDescription", { defaultValue: "Optional description" })}
            onChange={(event) => writeCriteria({ ...question.criteria, [label]: event.target.value })}
          />
          <RemoveButton
            label={t("playground.systemOne.removeOptionAria", { label, defaultValue: `Remove option ${label}` })}
            onClick={() => writeCriteria(withoutKey(question.criteria, label))}
          />
        </div>
      ))}
      <AddButton onClick={() => writeCriteria({ ...question.criteria, [freeName(labels, "option")]: "" })}>
        {t("playground.systemOne.addOption", { defaultValue: "Add option" })}
      </AddButton>
    </div>
  );
}

function NoulCriteria({ question, onChange }: QuestionEditorProps<NoulQuestion>) {
  const { t } = useTranslation();
  const yesId = useId();
  const noId = useId();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor={yesId}>{t("playground.systemOne.yesMeans", { defaultValue: "Yes means" })}</Label>
        <Input
          id={yesId}
          value={question.criteria?.true ?? ""}
          placeholder={t("playground.systemOne.optional", { defaultValue: "Optional" })}
          onChange={(event) => onChange(withNoulCriterion(question, "true", event.target.value))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={noId}>{t("playground.systemOne.noMeans", { defaultValue: "No means" })}</Label>
        <Input
          id={noId}
          value={question.criteria?.false ?? ""}
          placeholder={t("playground.systemOne.optional", { defaultValue: "Optional" })}
          onChange={(event) => onChange(withNoulCriterion(question, "false", event.target.value))}
        />
      </div>
    </div>
  );
}

function ScoreLevels({ question, onChange }: QuestionEditorProps<ScoreQuestion>) {
  const { t } = useTranslation();
  const writeCriteria = (criteria: string[]) => onChange({ ...question, criteria });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{t("playground.systemOne.levelsLowestFirst", { defaultValue: "Levels, lowest first" })}</span>
      {question.criteria.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{index}</span>
          <Input
            aria-label={t("playground.systemOne.levelAria", { number: index, defaultValue: `Level ${index}` })}
            value={level}
            placeholder={t("playground.systemOne.whatThisScoreMeans", { defaultValue: "What this score means" })}
            onChange={(event) => writeCriteria(replaceAt(question.criteria, index, event.target.value))}
          />
          <RemoveButton
            label={t("playground.systemOne.removeLevelAria", { number: index, defaultValue: `Remove level ${index}` })}
            onClick={() => writeCriteria(removeAt(question.criteria, index))}
          />
        </div>
      ))}
      <AddButton onClick={() => writeCriteria([...question.criteria, ""])}>
        {t("playground.systemOne.addLevel", { defaultValue: "Add level" })}
      </AddButton>
    </div>
  );
}

function CriteriaEditor({ question, onChange }: QuestionEditorProps<FormQuestion>) {
  switch (question.type) {
    case "choice":
      return <ChoiceOptions question={question} onChange={onChange} />;
    case "noul":
      return <NoulCriteria question={question} onChange={onChange} />;
    case "score":
      return <ScoreLevels question={question} onChange={onChange} />;
  }
}

interface QuestionCardProps extends QuestionEditorProps<FormQuestion> {
  name: string;
  taken: readonly string[];
  onRename: (name: string) => void;
  onRemove: () => void;
}

function QuestionCard({ name, question, taken, onChange, onRename, onRemove }: QuestionCardProps) {
  const { t } = useTranslation();
  const instructionsId = useId();

  const typeLabels: Record<QuestionType, string> = {
    choice: t("playground.systemOne.choice", { defaultValue: "Choice" }),
    noul: t("playground.systemOne.yesNo", { defaultValue: "Yes / no" }),
    score: t("playground.systemOne.score", { defaultValue: "Score" }),
  };
  const typeHelp: Partial<Record<QuestionType, string>> = {
    noul: t("playground.systemOne.yesNoHelp", { defaultValue: "The model returns the probability that the answer is yes" }),
  };

  return (
    <fieldset aria-label={t("playground.systemOne.question", { number: name, defaultValue: `Question ${name}` })} className="grid gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-start gap-2">
        <KeyInput key={name} label={t("playground.systemOne.questionName", { defaultValue: "Question name" })} value={name} taken={taken} onCommit={onRename} />
        <Select
          value={question.type}
          onValueChange={(type) => isQuestionType(type) && onChange(retype(question, type))}
        >
          <SelectTrigger className="w-36" aria-label={t("playground.systemOne.answerType", { defaultValue: "Answer type" })}>
            <SelectValue>{typeLabels[question.type]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type} title={typeHelp[type]}>
                {typeLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RemoveButton label={t("playground.systemOne.removeQuestionAria", { number: name, defaultValue: `Remove question ${name}` })} onClick={onRemove} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={instructionsId}>{t("playground.systemOne.instructions", { defaultValue: "Instructions" })}</Label>
        <Textarea
          id={instructionsId}
          rows={2}
          value={question.instructions ?? ""}
          placeholder={t("playground.systemOne.whatShouldModelDecide", { defaultValue: "What should the model decide?" })}
          onChange={(event) => onChange({ ...question, instructions: event.target.value })}
        />
      </div>
      <CriteriaEditor question={question} onChange={onChange} />
    </fieldset>
  );
}

export default function SystemOneForm({ value, onChange, validation, onReset }: SystemOneFormProps) {
  const { t } = useTranslation();
  const stateId = useId();
  const form = useMemo(() => readForm(value), [value]);

  if (form === undefined) {
    return (
      <FormFrame validation={validation}>
        <p className="text-sm text-muted-foreground">{t("playground.systemOne.unrepresentableShape", { defaultValue: "This request has a shape the form can't show." })}</p>
        <Button variant="outline" className="w-fit" onClick={onReset}>
          {t("playground.systemOne.resetToExample", { defaultValue: "Reset to example" })}
        </Button>
      </FormFrame>
    );
  }

  const questions = form.questions ?? {};
  const names = Object.keys(questions);
  const write = (next: FormPayload) => onChange(JSON.stringify(next, null, 2));
  const writeQuestions = (next: Record<string, FormQuestion>) => write({ ...form, questions: next });

  return (
    <FormFrame validation={validation}>
      <div className="grid gap-1.5">
        <Label htmlFor={stateId}>{t("playground.systemOne.input", { defaultValue: "Input" })}</Label>
        <p className="text-xs text-muted-foreground">{t("playground.systemOne.inputHint", { defaultValue: "The text the model reads before it answers, such as a support ticket or a chat message." })}</p>
        <Textarea
          id={stateId}
          rows={4}
          value={form.state ?? ""}
          placeholder={t("playground.systemOne.pasteText", { defaultValue: "Paste the text the model should decide about" })}
          onChange={(event) => write({ ...form, state: event.target.value })}
        />
      </div>
      {Object.entries(questions).map(([name, question], index) => (
        <QuestionCard
          key={index}
          name={name}
          question={question}
          taken={names}
          onChange={(next) => writeQuestions({ ...questions, [name]: next })}
          onRename={(next) => writeQuestions(renameKey(questions, name, next))}
          onRemove={() => writeQuestions(withoutKey(questions, name))}
        />
      ))}
      <AddButton onClick={() => writeQuestions({ ...questions, [freeName(names, "question")]: blankQuestion() })}>
        {t("playground.systemOne.addQuestion", { defaultValue: "Add question" })}
      </AddButton>
    </FormFrame>
  );
}
