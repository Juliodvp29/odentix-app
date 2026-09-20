// ESLint flat config: Angular recommended rules plus project-specific bans on
// pre-signals patterns (*ngIf/*ngFor, @Input/@Output decorators, NgModules).
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', '.angular/', 'node_modules/'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/prefer-inject': 'error',
      '@angular-eslint/prefer-output-emitter-ref': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Decorator[expression.callee.name="Input"]',
          message: 'Use the input() signal API instead of the @Input() decorator.',
        },
        {
          selector: 'Decorator[expression.callee.name="Output"]',
          message: 'Use the output() signal API instead of the @Output() decorator.',
        },
        {
          selector: 'Decorator[expression.callee.name="NgModule"]',
          message: 'This project uses standalone components only. Do not introduce NgModules.',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {
      '@angular-eslint/template/prefer-control-flow': 'error',
    },
  },
  eslintConfigPrettier,
);
