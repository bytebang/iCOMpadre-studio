
 Logic blocks are essential for building logical conditions, handling user input, and managing program flow in block-based programming environments. They can be combined in various ways to create complex behavior, such as game mechanics or app logic.

---

## Comparison Block

#### Purpose
Compares two values, and returns a boolean if the condition is met. Depending on the selected comparator the result looks like the following:

| **Operator** | **Description**                 | **Example**                                     |
|--------------|---------------------------------|------------------------------------------------|
| `=`          | Checks if two values are equal. | `if (a = 5) { display "a is 5"; }`             |
| `≠`          | Checks if two values are not equal. | `if (a ≠ 5) { display "a is not 5"; }`         |
| `<`          | Checks if one value is less than another. | `if (a < 10) { display "a is less than 10"; }` |
| `≤`          | Checks if one value is less than or equal to another. | `if (a ≤ 10) { display "a is 10 or less"; }`   |
| `>`          | Checks if one value is greater than another. | `if (a > 10) { display "a is greater than 10"; }` |
| `≥`          | Checks if one value is greater than or equal to another. | `if (a ≥ 10) { display "a is 10 or more"; }`   |

#### Usage
Used in conditional statements to compare variables or values.

---

## Logical AND / OR Block

#### Purpose
Combines two conditions.

#### Usage
Used to combine multiple conditions that must all (AND block) or only one of them (OR block) be satisfied.


| **Input A** | **Input B** | **A AND B** | **A OR B** |
|-------------|-------------|-------------|------------|
| `false`     | `false`     | `false`     | `false`    |
| `false`     | `true`      | `false`     | `true`     |
| `true`      | `false`     | `false`     | `true`     |
| `true`      | `true`      | `true`      | `true`     |


#### Example
`if (collectedAllItems and reachedFinishLine) { display "Level complete!"; }`

---

## Boolean Operator Block

#### Purpose
Represents a constant boolean value of `true` or `false`.

#### Usage
Used as a default or constant value in logical conditions or to toggle states.

#### Example
`if (true) { display "This message always shows!"; }`

---

## Logical NOT Block

#### Purpose
Inverts a boolean value. Returns `true` if input is `false` and `false` if input is `true`.

#### Usage
Used to check if a condition is *not* met.

#### Example
`if (not isLoggedIn) { display "Please log in!"; }`




