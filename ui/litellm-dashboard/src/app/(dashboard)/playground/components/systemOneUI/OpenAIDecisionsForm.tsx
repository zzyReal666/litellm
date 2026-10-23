"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useId, useMemo } from "react";
import { AddButton, FormFrame, RemoveButton } from "./DecisionFormControls";
import { freeName, removeAt, replaceAt } from "./lib/formPayload";
import {
  readDecisionsForm,
  retypeDecisionQuestion,
  type DecisionsFormPayload,
  type DecisionsFormQuestion,
  type DecisionsQuestionType,
} from "./lib/openAIDecisionsForm";
import type { OpenAIDecisionsRequest } from "./lib/openAIDecisions";
import type { PayloadValidation } from "./lib/validatePayload";

const QUESTION_TYPES: readonly DecisionsQuestionType[] = ["predicate", "choice", "score"];

interface QuestionEditorProps<Q extends DecisionsFormQuestion = DecisionsFormQuestion> {
  question: Q;
  onChange: (question: DecisionsFormQuestion) => void;
}

function Choices({ question, onChange }: QuestionEditorProps<Extract<DecisionsFormQuestion, { type: "choice" }>>) {
  const { t } = useTranslation();
  const choices = question.choices ?? [];
  const write = (next: typeof choices) => onChange({ ...question, choices: next });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{t("playground.systemOne.choices", { defaultValue: "Choices" })}</span>
      {choices.map((choice, index) => (
        <div key={index} className="grid gap-2 rounded-md border p-2">
          <div className="flex items-center gap-2">
            <Select
              value={typeof choice.value === "string" ? "text" : String(choice.value)}
              onValueChange={(type) => {
                if (type === "text" || type === "true" || type === "false") {
                  const value = type === "text" ? String(choice.value) : type === "true";
                  write(replaceAt(choices, index, { ...choice, value }));
                }
              }}
            >
              <SelectTrigger className="w-40" aria-label={t("playground.systemOne.choiceValueTypeAria", { number: index + 1, defaultValue: `Choice ${index + 1} value type` })}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">{t("playground.systemOne.text", { defaultValue: "Text" })}</SelectItem>
                <SelectItem value="true">{t("playground.systemOne.trueValue", { defaultValue: "true (boolean)" })}</SelectItem>
                <SelectItem value="false">{t("playground.systemOne.falseValue", { defaultValue: "false (boolean)" })}</SelectItem>
              </SelectContent>
            </Select>
            {typeof choice.value === "string" && (
              <Input
                aria-label={t("playground.systemOne.choiceValueAria", { number: index + 1, defaultValue: `Choice ${index + 1} value` })}
                value={choice.value}
                onChange={(event) => write(replaceAt(choices, index, { ...choice, value: event.target.value }))}
              />
            )}
            <RemoveButton
              label={t("playground.systemOne.removeChoiceAria", { number: index + 1, defaultValue: `Remove choice ${index + 1}` })}
              onClick={() => write(removeAt(choices, index))}
            />
          </div>
          <Input
            aria-label={t("playground.systemOne.choiceDescriptionAria", { number: index + 1, defaultValue: `Choice ${index + 1} description` })}
            value={choice.description ?? ""}
            placeholder={t("playground.systemOne.optionalDescription", { defaultValue: "Optional description" })}
            onChange={(event) => write(replaceAt(choices, index, { ...choice, description: event.target.value }))}
          />
        </div>
      ))}
      <AddButton
        onClick={() =>
          write([
            ...choices,
            {
              value: freeName(
                choices.map((c) => String(c.value)),
                "option",
              ),
            },
          ])
        }
      >
        {t("playground.systemOne.addChoice", { defaultValue: "Add choice" })}
      </AddButton>
    </div>
  );
}

function Levels({ question, onChange }: QuestionEditorProps<Extract<DecisionsFormQuestion, { type: "score" }>>) {
  const { t } = useTranslation();
  const levels = question.levels ?? [];
  const write = (next: typeof levels) => onChange({ ...question, levels: next });

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{t("playground.systemOne.levelsLowestFirst", { defaultValue: "Levels, lowest first" })}</span>
      {levels.map((level, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={t("playground.systemOne.levelLabelAria", { number: index + 1, defaultValue: `Level ${index + 1} label` })}
            value={level.label}
            placeholder={t("playground.systemOne.label", { defaultValue: "Label" })}
            onChange={(event) => write(replaceAt(levels, index, { ...level, label: event.target.value }))}
          />
          <Input
            aria-label={t("playground.systemOne.levelDescriptionAria", { number: index + 1, defaultValue: `Level ${index + 1} description` })}
            value={level.description ?? ""}
            placeholder={t("playground.systemOne.optionalDescription", { defaultValue: "Optional description" })}
            onChange={(event) => write(replaceAt(levels, index, { ...level, description: event.target.value }))}
          />
          <RemoveButton
            label={t("playground.systemOne.removeLevelAria", { number: index + 1, defaultValue: `Remove level ${index + 1}` })}
            onClick={() => write(removeAt(levels, index))}
          />
        </div>
      ))}
      <AddButton onClick={() => write([...levels, { label: String(levels.length) }])}>
        {t("playground.systemOne.addLevel", { defaultValue: "Add level" })}
      </AddButton>
    </div>
  );
}

interface QuestionCardProps extends QuestionEditorProps {
  index: number;
  onRemove: () => void;
}

function QuestionCard({ question, index, onChange, onRemove }: QuestionCardProps) {
  const { t } = useTranslation();
  const instructionsId = useId();

  return (
    <fieldset aria-label={t("playground.systemOne.question", { number: index + 1, defaultValue: `Question ${index + 1}` })} className="grid gap-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t("playground.systemOne.questionName", { defaultValue: "Question name" })}
          className="min-w-0 flex-1"
          value={question.name ?? ""}
          placeholder={t("playground.systemOne.optionalQuestionName", { defaultValue: "Optional question name" })}
          onChange={(event) => onChange({ ...question, name: event.target.value })}
        />
        <Select
          value={question.type}
          onValueChange={(type) => {
            const next = QUESTION_TYPES.find((value) => value === type);
            if (next) onChange(retypeDecisionQuestion(question, next));
          }}
        >
          <SelectTrigger className="w-36" aria-label={t("playground.systemOne.answerType", { defaultValue: "Answer type" })}>
            <SelectValue>
              {t(`playground.systemOne.${question.type}`, { defaultValue: question.type === "predicate" ? "Predicate" : question.type === "choice" ? "Choice" : "Score" })}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {QUESTION_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`playground.systemOne.${type}`, { defaultValue: type === "predicate" ? "Predicate" : type === "choice" ? "Choice" : "Score" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <RemoveButton
          label={t("playground.systemOne.removeQuestionAria", { number: index + 1, defaultValue: `Remove question ${index + 1}` })}
          onClick={onRemove}
        />
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
      {question.type === "choice" && <Choices question={question} onChange={onChange} />}
      {question.type === "score" && <Levels question={question} onChange={onChange} />}
    </fieldset>
  );
}

interface OpenAIDecisionsFormProps {
  value: string;
  onChange: (value: string) => void;
  validation: PayloadValidation<OpenAIDecisionsRequest>;
  onReset: () => void;
}

export default function OpenAIDecisionsForm({ value, onChange, validation, onReset }: OpenAIDecisionsFormProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const safetyId = useId();
  const form = useMemo(() => readDecisionsForm(value), [value]);

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

  const questions = form.questions ?? [];
  const write = (next: DecisionsFormPayload) => onChange(JSON.stringify(next, null, 2));
  const writeQuestions = (next: DecisionsFormQuestion[]) => write({ ...form, questions: next });

  return (
    <FormFrame validation={validation}>
      <div className="grid gap-1.5">
        {Array.isArray(form.input) ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t("playground.systemOne.messagesUnchanged", { defaultValue: "Input contains messages. Form edits keep them unchanged." })}
            </p>
          </>
        ) : (
          <>
            <Label htmlFor={inputId}>{t("playground.systemOne.input", { defaultValue: "Input" })}</Label>
            <Textarea
              id={inputId}
              rows={4}
              value={form.input ?? ""}
              placeholder={t("playground.systemOne.pasteText", { defaultValue: "Paste the text the model should decide about" })}
              onChange={(event) => write({ ...form, input: event.target.value })}
            />
          </>
        )}
      </div>
      {questions.map((question, index) => (
        <QuestionCard
          key={index}
          index={index}
          question={question}
          onChange={(next) => writeQuestions(replaceAt(questions, index, next))}
          onRemove={() => writeQuestions(removeAt(questions, index))}
        />
      ))}
      <AddButton
        onClick={() =>
          writeQuestions([
            ...questions,
            {
              type: "predicate",
              name: freeName(
                questions.map((q) => q.name ?? ""),
                "question",
              ),
              instructions: "",
            },
          ])
        }
      >
        {t("playground.systemOne.addQuestion", { defaultValue: "Add question" })}
      </AddButton>
      <div className="grid gap-1.5">
        <Label htmlFor={safetyId}>{t("playground.systemOne.safetyIdentifier", { defaultValue: "Safety identifier" })}</Label>
        <Input
          id={safetyId}
          value={form.safety_identifier ?? ""}
          placeholder={t("playground.systemOne.optional", { defaultValue: "Optional" })}
          onChange={(event) => write({ ...form, safety_identifier: event.target.value || undefined })}
        />
      </div>
    </FormFrame>
  );
}
